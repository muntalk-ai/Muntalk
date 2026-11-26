import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — AI နဲ့ အင်္ဂလိပ်စကားပြော လေ့ကျင့်ပါ | အခမဲ့ လေ့ကျင့်ခြင်း',
  description:
    'AI ဆရာနဲ့ နေ့စဉ် အင်္ဂလိပ်စကားပြော လေ့ကျင့်ပါ။ လက်တွေ့အခြေအနေ ၁၅၀ ကျော်၊ အသံထွက် ပြင်ဆင်ခြင်း၊ စကားပြောအဆင့် စစ်ဆေးခြင်း အခမဲ့။ ကတ် အပ်နှံစရာ မလိုပါ။',
  alternates: {
    canonical: '/my',
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

const FONT = "'Nunito','Noto Sans Myanmar',-apple-system,sans-serif";

export default function BurmeseLanding() {
  const totalLessons = CURRICULUM.flatMap((l) =>
    l.steps.flatMap((s) => s.lessons),
  ).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', color: '#0F172A', fontFamily: FONT }}>
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
            ဝင်ရောက်ပါ
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            အခမဲ့ စတင်ပါ
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
              🌐 ဘာသာစကား ၁၀၀ · AI ဆရာ ၁၅၀+
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 စကားပြောအဆင့် စစ်ဆေးခြင်း <strong>&nbsp;အခမဲ့</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            အင်္ဂလိပ်စကားပြော၊
            <br />
            အခု AI ဆရာနဲ့ နေ့တိုင်း လေ့ကျင့်ပါ
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            ဖုန်းအင်္ဂလိပ်စာ သင်တန်း ကြိုတင်စာရင်းပေးစရာ မလို၊ ရှက်စရာ မလို။
            <br />
            လေဆိပ်မှာ check-in လုပ်တာကနေ စီးပွားရေး အစည်းအဝေးအထိ — လက်တွေ့အခြေအနေ ၁၅၀ ကျော်။
            <br />
            အသံထွက် ပြင်ဆင်ခြင်းနဲ့ အကြံပြုချက် အစီရင်ခံစာက အခြေခံ ပါဝင်ပါတယ်။
            <br />
            တစ်လ $29.99 တန်တဲ့ နိုင်ငံခြား app ရဲ့ AI စကားပြော လုပ်ဆောင်ချက်၊ MunTalk က အခမဲ့ စတင်နိုင်ပါတယ်။
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
              🚀 အခမဲ့ စတင်ပါ
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              ကိုယ့်အဆင့်ကို သိပါ (၅ မိနစ်)
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 အခမဲ့ အစီအစဉ် ရှိပါတယ်</span>
            <span>💬 Duolingo Max အဆင့် AI စကားပြော $0 ကနေ</span>
            <span>💳 ကတ် အပ်နှံစရာ မလို</span>
            <span>⏰ ၂၄ နာရီ အချိန်မရွေး လေ့ကျင့်နိုင်ပါတယ်</span>
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
            ['150+', 'AI ဆရာ', '🤖', '#EFF6FF', '#2563EB'],
            ['100', 'သင်ယူဖို့ ဘာသာစကား', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), 'သင်ခန်းစာ', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', 'အဆင့်စနစ်', '🎓', '#FAF5FF', '#7C3AED'],
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
          ဘာကြောင့် MunTalk လဲ။
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', 'လက်တွေ့အခြေအနေ သရုပ်ဆောင်မှု', 'အင်တာဗျူး၊ လေဆိပ်၊ စီးပွားရေး အစည်းအဝေး… အခြေအနေ ၁၅၀ ကျော်မှာ AI ဆရာနဲ့ တိုက်ရိုက် စကားပြောပြီး လေ့ကျင့်ပါ။'],
              ['🗣️', 'အသံထွက် ပြင်ဆင်ခြင်း + အကြံပြုချက် အစီရင်ခံစာ', 'စကားပြောပြီးရင် အသံထွက် ပြင်ဆင်ခြင်းနဲ့ အသေးစိတ် အကြံပြုချက် အစီရင်ခံစာကို ရပါတယ်။ ဘာလိုနေလဲ ချက်ချင်း သိနိုင်ပါတယ်။'],
              ['🎯', '၅ မိနစ် စကားပြောအဆင့် စစ်ဆေးခြင်း', 'လက်ရှိအဆင့်ကို တိကျစွာ စစ်ဆေးပြီး သင့်တော်တဲ့ အဆင့်ကနေ စတင်ပါ။ စစ်ဆေးခြင်း အခမဲ့ပါ။'],
              ['📚', 'A1 ကနေ C2 အထိ သင်ရိုးညွှန်းတမ်း', 'ဥရောပ ဘုံဘာသာစကား စံ (CEFR) နဲ့ ကိုက်ညီတဲ့ စနစ်တကျ အဆင့်လိုက် သင်ယူမှု။ အစပြုသူရော အဆင့်မြင့်သူရော သွားရမယ့် လမ်းရှိပါတယ်။'],
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
          ဒီလို စတင်ပါ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', 'အဆင့် စစ်ဆေးပါ', '၅ မိနစ်နဲ့ ကိုယ့်စကားပြော အဆင့်ကို သိနိုင်ပါတယ်။'],
              ['2', 'ဆရာနဲ့ စကားပြောပါ', 'AI ဆရာ ၁၅၀+ ထဲက ကြိုက်တဲ့ ဆရာကို ရွေးပြီး စကားပြောပါ။'],
              ['3', 'အကြံပြုချက်နဲ့ တိုးတက်ပါ', 'အသံထွက် ပြင်ဆင်ခြင်းနဲ့ အစီရင်ခံစာနဲ့ အားနည်းချက်ကို ဖြည့်ပါ။'],
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
          မေးလေ့ရှိတဲ့ မေးခွန်းများ
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['တကယ် အခမဲ့လား။', 'ဟုတ်ပါတယ်။ အဆင့် စစ်ဆေးခြင်းနဲ့ အခမဲ့ အစီအစဉ်နဲ့ စတင်နိုင်ပြီး ကတ် အပ်နှံစရာလည်း မလိုပါ။ သင်ခန်းစာနဲ့ လုပ်ဆောင်ချက် ပိုလိုရင် ပရီမီယံ အစီအစဉ်ကို ရွေးပါ။'],
              ['အင်္ဂလိပ် လုံးဝ မပြောတတ်လည်း ရလား။', 'ရပါတယ်။ Pre-A1 အစပြုသင်တန်းကနေ ရုပ်ပုံလိုက်ဖက်တာ၊ နားထောင်တာ၊ အသံထွက် လေ့ကျင့်တာနဲ့ တဆင့်ချင်း စတင်နိုင်ပါတယ်။'],
              ['ဖုန်းအင်္ဂလိပ်စာနဲ့ ဘာကွာလဲ။', 'ကြိုတင် စာရင်းပေးစရာ မလို၊ ၂၄ နာရီ အချိန်မရွေး လေ့ကျင့်နိုင်ပြီး မှားလည်း ရှက်စရာ မလိုပါ။ အခြေအနေတစ်ခုတည်းကို အကန့်အသတ်မရှိ ထပ်ခါထပ်ခါ လေ့ကျင့်နိုင်တာက အကြီးဆုံး ကွာခြားချက်ပါ။'],
              ['အင်္ဂလိပ်အပြင် တခြားဘာသာစကား သင်လို့ရလား။', 'ရပါတယ်။ အင်္ဂလိပ်အပါအဝင် ဘာသာစကား ၁၀၀ သင်နိုင်ပါတယ်။ သင်ချင်တဲ့ ဘာသာစကားနဲ့ မိခင်ဘာသာစကားကို လွတ်လပ်စွာ တွဲပါ။'],
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
            ဒီနေ့ ၁၀ မိနစ်၊ AI ဆရာနဲ့ စကားပြောကြည့်ပါ
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            အကောင့်ဖွင့်ဖို့ ၁ မိနစ်ပဲ ကြာပါတယ်။ ကတ် အပ်နှံစရာမလို ချက်ချင်း စတင်နိုင်ပါတယ်။
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
            🚀 အခမဲ့ စတင်ပါ
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · AI နဲ့ ဘာသာစကား သင်ယူခြင်း</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>အကူအညီ</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>ဈေးနှုန်း</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>ကိုယ်ရေးကိုယ်တာ မူဝါဒ</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>အသုံးပြုမှု စည်းမျဉ်းများ</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
