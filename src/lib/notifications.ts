// lib/notifications.ts
// FCM 푸시 알림 + Resend 이메일 헬퍼

// ─── FCM 푸시 알림 ────────────────────────────────────────────────────────────
// VAPID 키는 Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// .env.local: NEXT_PUBLIC_FIREBASE_VAPID_KEY=...

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export async function requestPushPermission(uid: string): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (token) {
      // 토큰을 Firestore에 저장
      await setDoc(doc(db, 'fcm_tokens', uid), { token, updatedAt: new Date().toISOString() });
    }
    return token;
  } catch (e) {
    console.error('FCM token error:', e);
    return null;
  }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  const supported = await isSupported();
  if (!supported) return;
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}

// ─── Resend 이메일 ────────────────────────────────────────────────────────────
// .env.local: RESEND_API_KEY=re_...
// .env.local: RESEND_FROM_EMAIL=noreply@yourdomain.com

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── 이메일 템플릿들 ──────────────────────────────────────────────────────────

export function buildDailyReviewEmail(opts: {
  name: string;
  language: string;
  dueCount: number;
  sentences: Array<{ word: string; sentence: string; translation: string }>;
  streak: number;
  appUrl: string;
}): string {
  const { name, language, dueCount, sentences, streak, appUrl } = opts;

  const sentenceRows = sentences.slice(0, 5).map(s => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #F1F5F9;">
        <div style="font-size:16px;font-weight:800;color:#6366F1;">${s.word}</div>
        <div style="font-size:14px;color:#0F172A;margin:4px 0;">${s.sentence}</div>
        <div style="font-size:13px;color:#94A3B8;">${s.translation}</div>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5FE;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.10);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🌍</div>
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:900;">Daily ${language} Review</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Hi ${name}! Your study session is ready.</p>
    </div>

    <!-- Streak & Due -->
    <div style="display:flex;padding:20px 32px;gap:16px;background:#F8FAFC;border-bottom:1px solid #F1F5F9;">
      <div style="flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#EA580C;">${streak}</div>
        <div style="font-size:12px;color:#94A3B8;font-weight:700;">🔥 Day Streak</div>
      </div>
      <div style="flex:1;text-align:center;">
        <div style="font-size:28px;font-weight:900;color:#6366F1;">${dueCount}</div>
        <div style="font-size:12px;color:#94A3B8;font-weight:700;">📚 Cards Due</div>
      </div>
    </div>

    <!-- Review sentences -->
    <div style="padding:24px 32px;">
      <h2 style="font-size:16px;font-weight:900;color:#0F172A;margin:0 0 16px;">Today's Review Words</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${sentenceRows}
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:24px 32px;text-align:center;">
      <a href="${appUrl}/lingua" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#fff;text-decoration:none;border-radius:16px;font-weight:900;font-size:15px;">
        Start Reviewing →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;text-align:center;background:#F8FAFC;border-top:1px solid #F1F5F9;">
      <p style="font-size:12px;color:#94A3B8;margin:0;">
        You're receiving this because you enabled daily reminders.<br>
        <a href="${appUrl}/profile" style="color:#6366F1;">Manage notifications</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function buildStreakWarningEmail(opts: { name: string; streak: number; appUrl: string }): string {
  const { name, streak, appUrl } = opts;
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FEF2F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(239,68,68,0.10);">
    <div style="background:linear-gradient(135deg,#EF4444,#F97316);padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">🔥</div>
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:900;">Your streak is at risk!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:8px 0 0;">Hi ${name}, don't break your ${streak}-day streak!</p>
    </div>
    <div style="padding:32px;text-align:center;">
      <p style="font-size:15px;color:#374151;line-height:1.6;">
        You haven't studied today yet. Just <strong>5 minutes</strong> is enough to keep your streak alive!
      </p>
      <a href="${appUrl}/lingua" style="display:inline-block;margin-top:16px;padding:14px 36px;background:linear-gradient(135deg,#EF4444,#F97316);color:#fff;text-decoration:none;border-radius:16px;font-weight:900;font-size:15px;">
        Save My Streak →
      </a>
    </div>
  </div>
</body>
</html>`;
}
