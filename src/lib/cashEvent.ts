// lib/cashEvent.ts
// $100 월간 출석·학습 이벤트 시스템 (Phase 2-1 PR-D)
//
// ⚠️ 공개 정책 (Jay 지시): 준비는 끝까지 하되 공개는 절대 하지 않음.
//    `ENABLE_CASH_EVENT = false` 상태로 구축 — false면 이벤트 관련 UI·문구가
//    유저에게 완전히 숨김. 활성화는 Jay가 "GO" 선언할 때만 (플래그 true + PR).
//
// 구성:
//  - 추적: users/{uid}/dailyStats/{YYYY-MM-DD} 서브컬렉션 (UTC 날짜)
//  - 자격: 해당 월 매일 minutes≥30 && xpEarned≥50 && 출석(activityDates)
//  - 추첨/지급: cash_events/{YYYY-MM} 문서 (어드민 전용)
//  - 어뷰징 필터: 비정상 패턴 계정을 추첨 대상에서 자동 제외
//
// Firestore rules 추가 필요 — firestore.rules에 아래 블록 추가 후
// ⚠️ Firebase 콘솔에서 수동 배포 (Jay):
//   match /users/{uid}/dailyStats/{date} {
//     allow read, write: if isOwner(uid) || isAdmin();
//   }
//   match /cash_events/{monthId} {
//     allow read, write: if isAdmin();
//   }

import { db } from './firebase';
import {
  doc, getDoc, setDoc, getDocs, collection,
  runTransaction, serverTimestamp, increment,
} from 'firebase/firestore';

// ── Feature Flag ─────────────────────────────────────────────────────────────
// false = 이벤트 비공개 (유저 UI 전체 숨김). Jay "GO" 선언 시 true로 변경.
export const ENABLE_CASH_EVENT = false;

// ── 이벤트 파라미터 ──────────────────────────────────────────────────────────
export const CASH_EVENT = {
  prizeUsd: 100,
  prizeLabel: '$100',
  dailyMinutesRequired: 30,   // 일일 최소 학습 분
  dailyXpRequired: 50,        // 일일 최소 XP (방치 어뷰징 방지)
  dailyMinutesCap: 120,       // 일일 집계 상한 (분)
  perCallMinutesCap: 45,      // 1회 기록 호출당 상한 (분)
  idleTimeoutSec: 300,        // 무반응 5분 시 시간 집계 중단
  instantSessionSec: 10,       // 이보다 짧은 세션은 "즉시 완료"로 카운트
  maxXpPerMinute: 40,         // 분당 XP 상한 (어뷰징 탐지)
} as const;

// ── 타입 ─────────────────────────────────────────────────────────────────────

export interface DailyStat {
  minutes: number;        // 당일 누적 학습 분 (활성 시간만)
  xpEarned: number;       // 당일 획득 XP 합계
  sessions: number;       // 당일 기록된 세션 수
  instantSessions: number;// 10초 미만 + XP>0 세션 수 (어뷰징 신호)
  updatedAt: any;
}

export interface DayRow extends DailyStat {
  date: string;           // YYYY-MM-DD (UTC)
  attended: boolean;      // activityDates 포함 여부
  qualified: boolean;     // minutes≥30 && xp≥50 && attended
  abuseFlags: string[];   // 어뷰징 탐지 플래그
}

export type CashEventStatus = 'active' | 'drawn' | 'paid';

export interface CashEventMonth {
  month: string;                       // YYYY-MM
  status: CashEventStatus;
  qualifiedUids: string[];             // 추첨 대상 (어뷰징 제외 후)
  excludedUids?: { uid: string; email: string; reasons: string[] }[];
  winnerUid?: string;
  winnerEmail?: string;
  drawnAt?: any;
  drawnBy?: string;
  notifiedAt?: any;
  paidMethod?: 'paypal' | 'amazon_gc' | 'wise';  // 당첨자 선택 (택1)
  paidTxnId?: string;
  paidAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

// ── 날짜 유틸 (UTC — recordActivity와 동일 기준) ─────────────────────────────

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthIdOf(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

/** 해당 월의 모든 날짜 (YYYY-MM-DD[]) — 월말/미래 날짜 제외 */
export function daysInMonth(monthId: string, joinedDate?: string): string[] {
  const [y, m] = monthId.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = utcToday();
  const out: string[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${monthId}-${String(d).padStart(2, '0')}`;
    if (ds > today) break;                    // 미래 날짜 제외
    if (joinedDate && ds < joinedDate) continue; // 가입 전 날짜 제외 (공정성)
    out.push(ds);
  }
  return out;
}

// ── D-1: 학습 세션 기록 ──────────────────────────────────────────────────────

/**
 * 학습 세션 기록 — 세션 종료 시점에 호출.
 * @param seconds 활성 학습 초 (idle/백그라운드 제외 — useActiveStudyTimer 사용 권장)
 * @param xpGained 해당 세션에서 획득한 XP (없으면 0)
 *
 * 일 120분 캡, 1회 호출당 45분 캡. increment 대신 트랜잭션으로 캡 강제.
 * ⚠️ 호출 규칙: 의미 있는 학습 활동 완료 시점에만 (방문 시점 호출 금지).
 */
export async function recordStudySession(
  uid: string,
  seconds: number,
  xpGained: number = 0,
): Promise<DailyStat | null> {
  if (!uid) return null;
  const secs = Math.max(0, Math.min(seconds, CASH_EVENT.perCallMinutesCap * 60));
  if (secs <= 0 && xpGained <= 0) return null;

  const date = utcToday();
  const ref = doc(db, 'users', uid, 'dailyStats', date);
  const addMinutes = secs / 60;
  const isInstant = secs < CASH_EVENT.instantSessionSec && xpGained > 0;

  try {
    const result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const cur = (snap.exists() ? snap.data() : {}) as Partial<DailyStat>;
      const minutes = Math.min(
        CASH_EVENT.dailyMinutesCap,
        (cur.minutes || 0) + addMinutes,
      );
      const next: DailyStat = {
        minutes: Math.round(minutes * 100) / 100,
        xpEarned: (cur.xpEarned || 0) + Math.max(0, xpGained),
        sessions: (cur.sessions || 0) + 1,
        instantSessions: (cur.instantSessions || 0) + (isInstant ? 1 : 0),
        updatedAt: serverTimestamp(),
      };
      tx.set(ref, next, { merge: true });
      return next;
    });
    return result;
  } catch (e) {
    // 오프라인/권한 실패 시 조용히 스킵 (학습 플로우에 영향 없음)
    console.warn('[cashEvent] recordStudySession failed:', e);
    return null;
  }
}

/** 특정 일자의 기록 조회 */
export async function getDailyStat(uid: string, date: string): Promise<DailyStat | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'dailyStats', date));
    return snap.exists() ? (snap.data() as DailyStat) : null;
  } catch {
    return null;
  }
}

// ── D-3: 자격 판정 ───────────────────────────────────────────────────────────

export function isDayQualified(stat: DailyStat | null, attended: boolean): boolean {
  if (!stat || !attended) return false;
  return (
    stat.minutes >= CASH_EVENT.dailyMinutesRequired &&
    stat.xpEarned >= CASH_EVENT.dailyXpRequired
  );
}

// ── D-4: 어뷰징 탐지 ─────────────────────────────────────────────────────────

/**
 * 어뷰징 플래그 탐지 — 월간 DayRow[] 기준.
 * 탐지 패턴:
 *  - instant: 10초 미만 + XP 획득 세션이 월 3회 이상
 *  - xp_rate: 분당 XP가 비정상 (매크로/조작 의심)
 *  - marathon: 하루 세션 30회 이상 (봇 의심)
 *  - exact30: 정확히 30.0~30.5분에 걸친 일수가 월 10일 이상 (타이머 매크로 의심)
 */
export function detectAbuseFlags(rows: DayRow[]): string[] {
  const flags: string[] = [];
  const totalInstant = rows.reduce((a, r) => a + (r.instantSessions || 0), 0);
  if (totalInstant >= 3) flags.push(`instant:${totalInstant}`);

  const totalMin = rows.reduce((a, r) => a + r.minutes, 0);
  const totalXp = rows.reduce((a, r) => a + r.xpEarned, 0);
  if (totalMin > 0 && totalXp / totalMin > CASH_EVENT.maxXpPerMinute) {
    flags.push(`xp_rate:${(totalXp / totalMin).toFixed(1)}/min`);
  }

  const maxSessions = Math.max(0, ...rows.map(r => r.sessions || 0));
  if (maxSessions >= 30) flags.push(`marathon:${maxSessions}/day`);

  const exact30 = rows.filter(r => r.minutes >= 30 && r.minutes < 30.5).length;
  if (exact30 >= 10) flags.push(`exact30:${exact30}d`);

  return flags;
}

const ABUSE_LABEL: Record<string, string> = {
  instant: '즉시 완료 세션 반복',
  xp_rate: '비정상 XP 획득 속도',
  marathon: '하루 과다 세션',
  exact30: '정확히 30분 패턴 반복 (매크로 의심)',
};

export function abuseLabel(flag: string): string {
  const key = flag.split(':')[0];
  const base = ABUSE_LABEL[key] || key;
  const detail = flag.includes(':') ? ` (${flag.split(':')[1]})` : '';
  return base + detail;
}

// ── 월간 진행 현황 집계 ──────────────────────────────────────────────────────

export interface MonthProgress {
  month: string;
  rows: DayRow[];
  qualifiedDays: number;
  totalDays: number;
  todayQualified: boolean;
  monthQualified: boolean; // 전일 자격 달성 여부
}

/**
 * 특정 유저의 월간 응모 현황 집계.
 * @param activityDates 프로필의 activityDates (출석 판정용)
 * @param joinedDate 가입일 (YYYY-MM-DD) — 가입 전 날짜는 집계 제외
 */
export async function getMonthProgress(
  uid: string,
  monthId: string,
  activityDates: string[],
  joinedDate?: string,
): Promise<MonthProgress> {
  const dates = daysInMonth(monthId, joinedDate);
  const attended = new Set(activityDates || []);
  const rows: DayRow[] = [];

  for (const date of dates) {
    const stat = await getDailyStat(uid, date);
    const isAttended = attended.has(date);
    const qualified = isDayQualified(stat, isAttended);
    rows.push({
      date,
      minutes: stat?.minutes || 0,
      xpEarned: stat?.xpEarned || 0,
      sessions: stat?.sessions || 0,
      instantSessions: stat?.instantSessions || 0,
      updatedAt: stat?.updatedAt || null,
      attended: isAttended,
      qualified,
      abuseFlags: [],
    });
  }

  const flags = detectAbuseFlags(rows);
  if (flags.length > 0) rows.forEach(r => { r.abuseFlags = flags; });

  const qualifiedDays = rows.filter(r => r.qualified).length;
  const today = utcToday();
  return {
    month: monthId,
    rows,
    qualifiedDays,
    totalDays: dates.length,
    todayQualified: rows.find(r => r.date === today)?.qualified || false,
    monthQualified: dates.length > 0 && qualifiedDays === dates.length && flags.length === 0,
  };
}

// ── 추첨 ─────────────────────────────────────────────────────────────────────

/** 암호학적 난수로 당첨자 1명 추첨 */
export function drawWinner(qualifiedUids: string[]): string | null {
  if (qualifiedUids.length === 0) return null;
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return qualifiedUids[arr[0] % qualifiedUids.length];
}

/** cash_events/{YYYY-MM} 문서 조회 */
export async function getCashEventMonth(monthId: string): Promise<CashEventMonth | null> {
  try {
    const snap = await getDoc(doc(db, 'cash_events', monthId));
    return snap.exists() ? ({ month: monthId, ...snap.data() } as CashEventMonth) : null;
  } catch {
    return null;
  }
}

/** 추첨 결과 저장 (어드민) */
export async function saveDrawResult(
  monthId: string,
  data: Partial<CashEventMonth>,
  adminEmail: string,
): Promise<void> {
  await setDoc(doc(db, 'cash_events', monthId), {
    ...data,
    month: monthId,
    drawnBy: adminEmail,
    drawnAt: serverTimestamp(),
    status: 'drawn',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** 지급 정보 업데이트 (어드민) */
export async function savePayoutInfo(
  monthId: string,
  payout: { paidMethod: CashEventMonth['paidMethod']; paidTxnId: string },
): Promise<void> {
  await setDoc(doc(db, 'cash_events', monthId), {
    ...payout,
    paidAt: serverTimestamp(),
    status: 'paid',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** 당첨 알림 발송 기록 */
export async function markNotified(monthId: string): Promise<void> {
  await setDoc(doc(db, 'cash_events', monthId), {
    notifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

// ── D-7: 당첨 알림 이메일 템플릿 ──────────────────────────────────────────────

export function buildWinnerEmail(opts: {
  name: string;
  monthLabel: string;
  appUrl: string;
}): string {
  const { name, monthLabel, appUrl } = opts;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FFFBEB;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(245,158,11,0.15);">
    <div style="background:linear-gradient(135deg,#F59E0B,#F97316);padding:40px 32px;text-align:center;">
      <div style="font-size:56px;margin-bottom:8px;">🎉</div>
      <h1 style="color:#fff;font-size:26px;margin:0;font-weight:900;">You won $${CASH_EVENT.prizeUsd}!</h1>
      <p style="color:rgba(255,255,255,0.9);font-size:15px;margin:10px 0 0;">${monthLabel} Monthly Learning Challenge</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="font-size:16px;color:#0F172A;line-height:1.7;margin:0 0 8px;">
        Hi ${name},
      </p>
      <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 24px;">
        Your dedication paid off — you studied <strong>every single day</strong> in ${monthLabel}
        and you've been randomly selected as this month's winner of the
        <strong> $${CASH_EVENT.prizeUsd} cash prize</strong>! 🏆
      </p>
      <p style="font-size:14px;color:#64748B;line-height:1.7;margin:0 0 24px;">
        Reply to this email and let us know how you'd like to receive your prize:<br>
        <strong>PayPal</strong> · <strong>Amazon Gift Card</strong> · <strong>Wise transfer</strong>
      </p>
      <a href="${appUrl}/lingua" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#F59E0B,#F97316);color:#fff;text-decoration:none;border-radius:16px;font-weight:900;font-size:15px;">
        Keep the streak going →
      </a>
    </div>
    <div style="padding:20px 32px;text-align:center;background:#F8FAFC;border-top:1px solid #F1F5F9;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">
        MunTalk Monthly Learning Challenge · No purchase necessary.<br>
        <a href="${appUrl}" style="color:#F59E0B;">muntalk.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── D-9: 약관 조항 초안 (법무 검토 전 — 렌더링하지 않음) ─────────────────────
// ⚠️ 실제 공개 전 법무 자문 필요. 국가별 경품 고시/사행성 규제 확인 대상.
export const CASH_EVENT_TERMS_DRAFT = `
[Draft — DO NOT PUBLISH without legal review]
MunTalk Monthly Learning Challenge — Official Rules (Draft)
1. Eligibility: Open to registered MunTalk users aged 18+ (or with parental consent).
   No purchase necessary to enter or win.
2. Qualification: Complete at least 30 minutes of active study with 50+ XP earned,
   every calendar day of the qualifying month (UTC), plus daily check-in.
3. Winner selection: One (1) winner drawn at random each month from all qualified
   entrants. Accounts flagged for abnormal activity (macros, tampering) are excluded.
4. Prize: USD 100 (or equivalent), delivered via PayPal, Amazon gift card, or Wise —
   winner's choice. Winner must respond within 14 days or prize is forfeited.
5. Taxes: Winners are responsible for any taxes on prizes per local law.
6. MunTalk may modify or cancel the promotion at any time with notice.
`;
