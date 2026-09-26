// app/admin/EventsPanel.tsx
// $100 월간 이벤트 어드민 패널 (Phase 2-1 PR-D)
// 월말 자격 달성자 집계 → 무작위 추첨 → 당첨자 기록/지급/알림
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { sendEmail } from '@/lib/notifications';
import {
  CASH_EVENT, daysInMonth, isDayQualified, detectAbuseFlags, abuseLabel,
  drawWinner, saveDrawResult, savePayoutInfo, markNotified, getCashEventMonth,
  buildWinnerEmail, utcToday, monthIdOf,
  type DayRow, type CashEventMonth,
} from '@/lib/cashEvent';

interface UserLite { uid: string; email: string; displayName: string; }
interface Props {
  users: UserLite[];
  adminEmail: string;
  logAction: (action: string, targetEmail: string, detail: string) => Promise<void>;
  showToast: (msg: string) => void;
}

interface UserEventRow {
  uid: string; email: string; displayName: string;
  qualifiedDays: number; totalDays: number;
  monthQualified: boolean;
  abuseFlags: string[];
}

const card: React.CSSProperties = {
  background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', padding: 24, marginBottom: 16,
};
const h2: React.CSSProperties = { fontSize: 15, fontWeight: 900, color: '#0F172A', margin: '0 0 16px' };
const btn = (bg: string, color = '#fff'): React.CSSProperties => ({
  padding: '10px 20px', borderRadius: 10, border: 'none', background: bg, color,
  fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
});

export default function EventsPanel({ users, adminEmail, logAction, showToast }: Props) {
  const [month, setMonth] = useState(monthIdOf(utcToday()));
  const [analyzing, setAnalyzing] = useState(false);
  const [rows, setRows] = useState<UserEventRow[]>([]);
  const [eventDoc, setEventDoc] = useState<CashEventMonth | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [paidMethod, setPaidMethod] = useState<'paypal' | 'amazon_gc' | 'wise'>('paypal');
  const [paidTxnId, setPaidTxnId] = useState('');
  const [sending, setSending] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const out: UserEventRow[] = [];
      for (const u of users) {
        // 프로필 (출석/가입일)
        let activityDates: string[] = [];
        let joinedDate: string | undefined;
        try {
          const psnap = await getDoc(doc(db, 'users', u.uid));
          if (psnap.exists()) {
            activityDates = psnap.data().activityDates || [];
            const ca = psnap.data().createdAt;
            joinedDate = ca?.toDate?.()?.toISOString?.()?.slice(0, 10) || ca?.slice?.(0, 10);
          }
        } catch {}
        const dates = daysInMonth(month, joinedDate);
        const attended = new Set(activityDates);
        // dailyStats (월 필터)
        const statMap = new Map<string, { minutes: number; xpEarned: number; sessions: number; instantSessions: number }>();
        try {
          const ssnap = await getDocs(collection(db, 'users', u.uid, 'dailyStats'));
          ssnap.docs.forEach(d => {
            if (d.id.startsWith(month)) {
              const v = d.data();
              statMap.set(d.id, {
                minutes: v.minutes || 0, xpEarned: v.xpEarned || 0,
                sessions: v.sessions || 0, instantSessions: v.instantSessions || 0,
              });
            }
          });
        } catch {}
        const dayRows: DayRow[] = dates.map(date => {
          const s = statMap.get(date);
          const isAtt = attended.has(date);
          return {
            date, minutes: s?.minutes || 0, xpEarned: s?.xpEarned || 0,
            sessions: s?.sessions || 0, instantSessions: s?.instantSessions || 0,
            updatedAt: null, attended: isAtt,
            qualified: isDayQualified(s ? { ...s, updatedAt: null } : null, isAtt),
            abuseFlags: [],
          };
        });
        const flags = detectAbuseFlags(dayRows);
        const qDays = dayRows.filter(r => r.qualified).length;
        out.push({
          uid: u.uid, email: u.email, displayName: u.displayName,
          qualifiedDays: qDays, totalDays: dates.length,
          monthQualified: dates.length > 0 && qDays === dates.length,
          abuseFlags: flags,
        });
      }
      out.sort((a, b) => Number(b.monthQualified) - Number(a.monthQualified) || b.qualifiedDays - a.qualifiedDays);
      setRows(out);
      const ev = await getCashEventMonth(month);
      setEventDoc(ev);
      if (ev?.paidMethod) setPaidMethod(ev.paidMethod);
      if (ev?.paidTxnId) setPaidTxnId(ev.paidTxnId);
    } catch (e: any) {
      showToast('❌ ' + e.message);
    }
    setAnalyzing(false);
  };

  const qualified = rows.filter(r => r.monthQualified && r.abuseFlags.length === 0);
  const excluded = rows.filter(r => r.abuseFlags.length > 0);

  const handleDraw = async () => {
    if (qualified.length === 0) { showToast('❌ No qualified users to draw from'); return; }
    if (!confirm(`Draw 1 winner from ${qualified.length} qualified user(s) for ${month}?`)) return;
    setDrawing(true);
    try {
      const winnerUid = drawWinner(qualified.map(q => q.uid));
      const winner = qualified.find(q => q.uid === winnerUid);
      await saveDrawResult(month, {
        qualifiedUids: qualified.map(q => q.uid),
        excludedUids: excluded.map(e => ({ uid: e.uid, email: e.email, reasons: e.abuseFlags.map(abuseLabel) })),
        winnerUid: winner?.uid,
        winnerEmail: winner?.email,
      }, adminEmail);
      await logAction('draw', winner?.email || '', `${month}: 1/${qualified.length} drawn`);
      const ev = await getCashEventMonth(month);
      setEventDoc(ev);
      showToast(`🎉 Winner: ${winner?.email}`);
    } catch (e: any) {
      showToast('❌ ' + e.message);
    }
    setDrawing(false);
  };

  const handleMarkPaid = async () => {
    if (!eventDoc?.winnerUid) return;
    if (!paidTxnId.trim()) { showToast('❌ Enter transaction ID'); return; }
    if (!confirm(`Mark ${eventDoc.winnerEmail} as PAID via ${paidMethod}?`)) return;
    try {
      await savePayoutInfo(month, { paidMethod, paidTxnId: paidTxnId.trim() });
      await logAction('payout', eventDoc.winnerEmail || '', `${month}: ${paidMethod} ${paidTxnId.trim()}`);
      const ev = await getCashEventMonth(month);
      setEventDoc(ev);
      showToast('✅ Marked as paid');
    } catch (e: any) {
      showToast('❌ ' + e.message);
    }
  };

  const handleSendWinnerEmail = async () => {
    if (!eventDoc?.winnerEmail) return;
    if (!confirm(`Send winner notification email to ${eventDoc.winnerEmail}?`)) return;
    setSending(true);
    try {
      const ok = await sendEmail({
        to: eventDoc.winnerEmail,
        subject: `🎉 You won $${CASH_EVENT.prizeUsd}! — MunTalk ${month} Challenge`,
        html: buildWinnerEmail({
          name: eventDoc.winnerEmail.split('@')[0],
          monthLabel: month,
          appUrl: window.location.origin,
        }),
      });
      if (ok) {
        await markNotified(month);
        await logAction('winner_email', eventDoc.winnerEmail, `${month} winner notified`);
        const ev = await getCashEventMonth(month);
        setEventDoc(ev);
        showToast('✅ Winner email sent');
      } else {
        showToast('❌ Email send failed');
      }
    } catch (e: any) {
      showToast('❌ ' + e.message);
    }
    setSending(false);
  };

  return (
    <div>
      <div style={card}>
        <h2 style={h2}>💰 Monthly Cash Event — {CASH_EVENT.prizeLabel} Prize</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none' }} />
          <button onClick={analyze} disabled={analyzing} style={btn(analyzing ? '#C7D2FE' : '#6366F1')}>
            {analyzing ? 'Analyzing…' : '🔍 Load Qualification'}
          </button>
          <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 700 }}>
            Rule: every day — check-in + {CASH_EVENT.dailyMinutesRequired}+ min + {CASH_EVENT.dailyXpRequired}+ XP
          </div>
        </div>

        {rows.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#ECFDF5', color: '#059669', fontWeight: 900, fontSize: 13 }}>
                ✅ Qualified: {qualified.length}
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#FFF1F2', color: '#E11D48', fontWeight: 900, fontSize: 13 }}>
                🚫 Abuse-excluded: {excluded.length}
              </div>
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#F8FAFC', color: '#64748B', fontWeight: 900, fontSize: 13 }}>
                👥 Checked: {rows.length}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left' }}>
                    {['Email', 'Name', 'Qualified days', 'Abuse flags', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', color: '#94A3B8', fontWeight: 900, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.uid} style={{ borderTop: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0F172A' }}>{r.email}</td>
                      <td style={{ padding: '8px 10px', color: '#64748B' }}>{r.displayName}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: r.monthQualified ? '#059669' : '#94A3B8' }}>
                        {r.qualifiedDays}/{r.totalDays}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {r.abuseFlags.length === 0
                          ? <span style={{ color: '#CBD5E1' }}>—</span>
                          : r.abuseFlags.map(f => (
                            <span key={f} style={{ display: 'inline-block', margin: '2px 4px 2px 0', padding: '3px 8px', borderRadius: 7, background: '#FFF1F2', color: '#E11D48', fontSize: 10, fontWeight: 900 }}>
                              🚫 {abuseLabel(f)}
                            </span>
                          ))}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 900, fontSize: 11 }}>
                        {r.monthQualified && r.abuseFlags.length === 0
                          ? <span style={{ color: '#059669' }}>✅ ELIGIBLE</span>
                          : r.abuseFlags.length > 0
                            ? <span style={{ color: '#E11D48' }}>EXCLUDED</span>
                            : <span style={{ color: '#94A3B8' }}>not qualified</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* 추첨 */}
      {rows.length > 0 && (
        <div style={card}>
          <h2 style={h2}>🎲 Draw Winner</h2>
          {eventDoc?.winnerUid ? (
            <div>
              <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FFFBEB', border: '1.5px solid #FDE68A', marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: '#92400E', fontWeight: 700 }}>Winner of {month}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>🎉 {eventDoc.winnerEmail}</div>
                <div style={{ fontSize: 11, color: '#B45309', fontWeight: 700, marginTop: 4 }}>
                  Drawn from {eventDoc.qualifiedUids?.length || 0} eligible · Status: {eventDoc.status}
                  {eventDoc.notifiedAt && ' · 📧 notified'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <button onClick={handleSendWinnerEmail} disabled={sending} style={btn(sending ? '#C7D2FE' : '#F59E0B')}>
                  {sending ? 'Sending…' : '📧 Send Winner Email'}
                </button>
              </div>

              <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
                Payout (manual MVP — PayPal / Amazon GC / Wise)
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={paidMethod} onChange={e => setPaidMethod(e.target.value as any)}
                  style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: "'Nunito',sans-serif", fontWeight: 800 }}>
                  <option value="paypal">PayPal</option>
                  <option value="amazon_gc">Amazon Gift Card</option>
                  <option value="wise">Wise Transfer</option>
                </select>
                <input value={paidTxnId} onChange={e => setPaidTxnId(e.target.value)}
                  placeholder="Transaction ID / reference"
                  style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 13, fontFamily: "'Nunito',sans-serif", outline: 'none', minWidth: 220 }} />
                <button onClick={handleMarkPaid} style={btn('#059669')}>✅ Mark as Paid</button>
              </div>
              {eventDoc.status === 'paid' && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#059669', fontWeight: 800 }}>
                  ✅ Paid via {eventDoc.paidMethod} · {eventDoc.paidTxnId}
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleDraw} disabled={drawing || qualified.length === 0} style={btn(drawing || qualified.length === 0 ? '#E5E7EB' : '#F59E0B', drawing || qualified.length === 0 ? '#94A3B8' : '#fff')}>
              {drawing ? 'Drawing…' : `🎲 Draw 1 Winner from ${qualified.length} eligible`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
