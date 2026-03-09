// lib/telegram.ts
// 텔레그램 봇 연동
// 설정:
//   1. @BotFather 에서 /newbot → 토큰 받기
//   2. .env.local: TELEGRAM_BOT_TOKEN=...
//   3. 유저가 봇에 /start 보내면 chat_id 저장
//   4. Webhook: https://api.telegram.org/bot{TOKEN}/setWebhook?url={APP_URL}/api/telegram/webhook

export interface TelegramMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: object; // 버튼 등
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE  = `https://api.telegram.org/bot${BOT_TOKEN}`;

/** 메시지 발송 */
export async function sendTelegramMessage(msg: TelegramMessage): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id:    msg.chatId,
        text:       msg.text,
        parse_mode: msg.parseMode || 'HTML',
        reply_markup: msg.replyMarkup,
      }),
    });
    return res.ok;
  } catch { return false; }
}

/** 일일 복습 메시지 */
export function buildDailyReviewMessage(opts: {
  name: string;
  language: string;
  dueCount: number;
  streak: number;
  sentences: Array<{ word: string; translation: string; sentence?: string }>;
  appUrl: string;
}): string {
  const { name, language, dueCount, streak, sentences, appUrl } = opts;
  const words = sentences.slice(0, 5).map(s =>
    `📖 <b>${s.word}</b> — ${s.translation}${s.sentence ? `\n    <i>${s.sentence}</i>` : ''}`
  ).join('\n\n');

  return `🌍 <b>Daily ${language} Review</b>

Hi ${name}! 👋

🔥 Streak: <b>${streak} days</b>
📚 Cards due: <b>${dueCount}</b>

<b>Today's words:</b>

${words}

<a href="${appUrl}/lingua/review">▶️ Start Reviewing</a>`;
}

/** 스트릭 경고 메시지 */
export function buildStreakWarningMessage(opts: {
  name: string;
  streak: number;
  appUrl: string;
}): string {
  const { name, streak, appUrl } = opts;
  return `🔥 <b>Streak Alert!</b>

Hi ${name}! Your <b>${streak}-day streak</b> is at risk!

You haven't studied today. Just 5 minutes will keep your streak alive!

<a href="${appUrl}/lingua">💪 Save My Streak Now</a>`;
}

/** 리그 업데이트 메시지 */
export function buildLeagueUpdateMessage(opts: {
  name: string;
  tier: string;
  rank: number;
  weeklyXp: number;
  promoted?: boolean;
  demoted?: boolean;
  newTier?: string;
  appUrl: string;
}): string {
  const { name, tier, rank, weeklyXp, promoted, demoted, newTier, appUrl } = opts;

  if (promoted) {
    return `🎉 <b>Promoted!</b>

Congrats ${name}! You've advanced to <b>${newTier} League</b>! 

Keep up the amazing work! 🚀

<a href="${appUrl}/lingua/league">🏆 View League</a>`;
  }

  if (demoted) {
    return `⬇️ <b>League Update</b>

Hi ${name}, you've moved down to <b>${newTier} League</b> this week.

Earn more XP to climb back up! 💪

<a href="${appUrl}/lingua/league">🏆 View League</a>`;
  }

  return `📊 <b>Weekly League Summary</b>

Hi ${name}!

🏅 League: <b>${tier}</b>
🏆 Rank: <b>#${rank}</b>
⭐ Weekly XP: <b>${weeklyXp.toLocaleString()}</b>

<a href="${appUrl}/lingua/league">View Full Rankings</a>`;
}

/** 클라이언트에서 텔레그램 연결 링크 생성 */
export function getTelegramBotLink(botUsername: string, uid: string): string {
  // /start 명령에 uid를 payload로 전달
  return `https://t.me/${botUsername}?start=${uid}`;
}
