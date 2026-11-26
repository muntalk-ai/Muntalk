import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — AI英语口语 | 免费口语练习',
  description:
    '每天和AI外教练英语口语。150多个真实场景、发音纠正、口语水平测试，全部免费。无需绑卡，立即开始。',
  alternates: {
    canonical: '/zh',
    languages: {
      en: '/',
      ko: '/ko',
      vi: '/vi',
      th: '/th',
      my: '/my',
      es: '/es',
      ja: '/ja',
      id: '/id',
      hi: '/hi',
      ar: '/ar',
      fa: '/fa',
      tr: '/tr',
      zh: '/zh',
      pt: '/pt',
      ru: '/ru',
      ms: '/ms',
      mn: '/mn',
      'x-default': '/',
    },
  },
};

const FONT = "'Nunito','Noto Sans SC',-apple-system,sans-serif";

export default function ChineseLanding() {
  const totalLessons = CURRICULUM.flatMap((l) =>
    l.steps.flatMap((s) => s.lessons),
  ).length;

  return (
    <div lang="zh-Hans" style={{ minHeight: '100vh', background: '#F8F9FA', color: '#0F172A', fontFamily: FONT }}>
      {/* -- Nav -- */}
      <nav
        style={{
          background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 200,
        }}
      >
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div
            style={{
              width: 36, height: 36, background: 'linear-gradient(135deg,#38BDF8,#818CF8)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}
          >
            🌍
          </div>
          <span style={{ fontWeight: 900, fontSize: 19, color: '#0F172A', letterSpacing: '-0.5px' }}>MunTalk</span>
          <span style={{ background: '#EFF6FF', color: '#0284C7', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
            BETA
          </span>
        </a>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href="/login"
            style={{ padding: '8px 16px', borderRadius: 20, color: '#475569', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
          >
            登录
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            免费开始
          </a>
        </div>
      </nav>

      {/* -- Hero -- */}
      <div
        style={{
          background: 'linear-gradient(135deg,#38BDF8 0%,#818CF8 55%,#FB7185 100%)',
          borderRadius: 28, margin: '28px 32px 0', padding: '64px 44px',
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 260, height: 260, background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 110, width: 200, height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', maxWidth: 620 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.18)',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
              }}
            >
              🌐 100种语言 · 150+位AI外教
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 口语水平测试 <strong>&nbsp;免费</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            英语口语，
            <br />
            现在每天和AI外教一起练
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            不用预约上课，也不用怕难为情。
            <br />
            从机场值机到商务会议——150多个真实场景。
            <br />
            发音纠正和反馈报告，一应俱全。
            <br />
            国外App的AI对话功能每月$29.99，MunTalk免费就能开始。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href="/signup"
              style={{
                background: '#fff', color: '#2563EB', borderRadius: 14, padding: '16px 38px',
                fontWeight: 900, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)', fontFamily: FONT,
              }}
            >
              🚀 免费开始
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              测测我的水平（5分钟）
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 提供免费方案</span>
            <span>💬 Duolingo Max级AI对话，$0起</span>
            <span>💳 无需绑定银行卡</span>
            <span>⏰ 24小时随时练习</span>
          </div>
        </div>
      </div>

      {/* -- Stats -- */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16,
          padding: '28px 32px 0', maxWidth: 1200, margin: '0 auto',
        }}
      >
        {(
          [
            ['150+', 'AI外教', '🤖', '#EFF6FF', '#2563EB'],
            ['100', '可学语言', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), '课程', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', '等级体系', '🎓', '#FAF5FF', '#7C3AED'],
          ] as [string, string, string, string, string][]
        ).map(([v, l, e, bg, ac]) => (
          <div
            key={l}
            style={{
              borderRadius: 18, padding: '20px 16px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, background: bg, border: '1px solid #E9ECEF',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
            }}
          >
            <span style={{ fontSize: 26 }}>{e}</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{v}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ac }}>{l}</span>
          </div>
        ))}
      </div>

      {/* -- Features -- */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 8px' }}>
        <p style={{ fontSize: 12, letterSpacing: 3, color: '#9CA3AF', fontWeight: 800, textAlign: 'center', margin: '0 0 10px' }}>
          WHY MUNTALK
        </p>
        <h2 style={{ fontSize: 30, fontWeight: 900, textAlign: 'center', margin: '0 0 36px', letterSpacing: '-0.5px' }}>
          为什么选择MunTalk？
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', '真实场景角色扮演', '面试、机场、商务会议……在150多个场景中直接和AI外教对话来学习。'],
              ['🗣️', '发音纠正 + 反馈报告', '每次对话结束后，你都会收到发音纠正和详细的反馈报告，一眼看出哪里还需要加强。'],
              ['🎯', '5分钟口语水平测试', '精准判断你当前的水平，从合适的级别开始。测试免费。'],
              ['📚', 'A1到C2完整课程', '以欧洲语言共同参考框架（CEFR）为基础，按级别循序渐进。零基础还是高阶学习者，都有适合的路线。'],
            ] as [string, string, string][]
          ).map(([emoji, title, desc]) => (
            <div
              key={title}
              style={{
                background: '#fff', borderRadius: 20, padding: 28, border: '1px solid #E9ECEF',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 10 }}>{title}</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, margin: 0, fontWeight: 600 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- Steps -- */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 8px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, textAlign: 'center', margin: '0 0 36px', letterSpacing: '-0.5px' }}>
          这样开始
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', '水平测试', '只需5分钟，了解你的口语水平。'],
              ['2', '和外教对话', '从150+位AI外教中选一位喜欢的，开始聊天。'],
              ['3', '靠反馈进步', '用发音纠正和报告补齐短板。'],
            ] as [string, string, string][]
          ).map(([n, title, desc]) => (
            <div key={n} style={{ textAlign: 'center', padding: '8px 12px' }}>
              <div
                style={{
                  width: 52, height: 52, borderRadius: '50%', margin: '0 auto 16px',
                  background: 'linear-gradient(135deg,#38BDF8,#818CF8)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 900,
                }}
              >
                {n}
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 8 }}>{title}</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, margin: 0, fontWeight: 600 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- FAQ -- */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 8px' }}>
        <h2 style={{ fontSize: 30, fontWeight: 900, textAlign: 'center', margin: '0 0 32px', letterSpacing: '-0.5px' }}>
          常见问题
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['真的免费吗？', '是的。无需绑卡，就能从水平测试和免费方案开始。需要更多课程和功能时，再选择Premium方案。'],
              ['我完全不会英语，也能学吗？', '当然可以。从Pre-A1课程开始，通过看图配对、听力和发音练习，一步一步来。'],
              ['和真人外教网课有什么不同？', '不用预约，24小时随时练，说错了也不尴尬。最大的不同是：同一个场景想练多少遍就练多少遍。'],
              ['除了英语，还能学其他语言吗？', '可以。包括英语在内共有100种语言可学，学习语言和母语可以自由搭配。'],
            ] as [string, string][]
          ).map(([q, a]) => (
            <div key={q} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E9ECEF' }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>Q. {q}</div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.75, margin: 0, fontWeight: 600 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- Final CTA -- */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg,#0F172A 0%,#1E3A5F 100%)', borderRadius: 28,
            padding: '56px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}
        >
          <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            今天花10分钟，和AI外教聊一聊
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            注册只需1分钟。无需绑卡，马上开始。
          </p>
          <a
            href="/signup"
            style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#38BDF8,#818CF8)',
              color: '#fff', borderRadius: 14, padding: '16px 48px',
              fontWeight: 900, fontSize: 17, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(56,189,248,0.4)', fontFamily: FONT,
            }}
          >
            🚀 免费开始
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · 用AI学语言</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>帮助</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>价格方案</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>隐私政策</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>使用条款</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
