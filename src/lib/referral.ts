// lib/referral.ts — 추천(Referral) 프로그램 공용 상수·헬퍼 (PR #114)
// 클라이언트/서버 공용. Firebase SDK를 import하지 않는다.

/** 리워드 수치 — 조정 시 여기만 변경 */
export const REFERRAL_REWARDS = {
  /** 추천받은 유저가 레슨 3개 완료 시 추천인에게 지급 */
  REFERRER_XP: 200,
  /** 추천 링크로 가입한 신규 유저에게 지급하는 웰컴 보너스 */
  WELCOME_XP: 100,
  /** 추천인 리워드 지급 조건 (완료 레슨 수) */
  LESSONS_REQUIRED: 3,
  /** 추천인 1명당 하루 최대 리워드 지급 횟수 (어뷰징 방지) */
  MAX_REWARDS_PER_DAY_PER_REFERRER: 20,
} as const;

/** /r/{code} 방문 시 localStorage에 저장하는 키 */
export const REFERRAL_CODE_KEY = 'mt_referral_code';

/** 혼동 문자(0/O, 1/I/L) 제외 32자 — 8자리 = 약 1조 조합 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const REFERRAL_CODE_LENGTH = 8;

/** 암호학적 난수로 추천 코드 생성 */
export function generateReferralCode(): string {
  const buf = new Uint32Array(REFERRAL_CODE_LENGTH);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    out += CODE_ALPHABET[buf[i] % CODE_ALPHABET.length];
  }
  return out;
}

/** 추천 코드 형식 검증 (서버/클라이언트 공용) */
export function isValidReferralCode(code: unknown): code is string {
  return (
    typeof code === 'string' &&
    code.length === REFERRAL_CODE_LENGTH &&
    [...code].every((c) => CODE_ALPHABET.includes(c))
  );
}

/** 추천 링크 생성 (현재 origin 기준 — preview에서도 동작) */
export function getReferralLink(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.muntalk.com';
  return `${origin}/r/${code}`;
}

// ── 외부 공개 카피 ──────────────────────────────────────────────
// ⚠️ 아래 문구는 외부에 공개되는 카피입니다. 변경 시 Jay 리뷰 필요.
export const REFERRAL_COPY = {
  /** /r/{code} 랜딩 — 추천인 이름이 확인된 경우 */
  inviteTitle: (name: string) => `${name} invited you to Muntalk!`,
  /** /r/{code} 랜딩 — 코드가 유효하지 않거나 이름 확인 실패 시 */
  inviteTitleGeneric: `You've been invited to Muntalk!`,
  inviteSubtitle: `Learn 90+ languages with AI tutors. Sign up with this invite and get ${REFERRAL_REWARDS.WELCOME_XP} XP free.`,
  inviteCta: `Claim invite →`,
  /** 프로필 Refer 탭 */
  referHeadline: `🎁 Invite friends, earn XP`,
  referBody: `Share your personal link. Your friend gets ${REFERRAL_REWARDS.WELCOME_XP} XP when they sign up — and you get ${REFERRAL_REWARDS.REFERRER_XP} XP when they finish ${REFERRAL_REWARDS.LESSONS_REQUIRED} lessons.`,
  referCta: `📤 Share invite link`,
  copied: `Link copied!`,
  /** 체험 완료 후 공유 (게스트 — 추천 코드 없음) */
  trialShareTitle: `Muntalk — Speak 90+ languages with AI tutors`,
  trialShareText: `I just tried speaking a new language with an AI tutor on Muntalk — free, no sign-up. Try it!`,
  trialShareCta: `📤 Share Muntalk`,
  /** 추천 링크 공유 (로그인 유저) */
  inviteShareTitle: `Join me on Muntalk!`,
  inviteShareText: `I'm learning languages with AI tutors on Muntalk. Join with my link and we both earn XP!`,
} as const;
