import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — یادگیری انگلیسی با هوش مصنوعی | تمرین رایگان مکالمه',
  description:
    'هر روز با معلم هوش مصنوعی انگلیسی صحبت کنید. بیش از 150 موقعیت واقعی، اصلاح تلفظ و آزمون رایگان سطح مکالمه. بدون نیاز به کارت، همین حالا شروع کنید.',
  alternates: {
    canonical: '/fa',
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

const FONT = "'Nunito','Noto Sans Arabic',-apple-system,sans-serif";

export default function PersianLanding() {
  const totalLessons = CURRICULUM.flatMap((l) =>
    l.steps.flatMap((s) => s.lessons),
  ).length;

  return (
    <div lang="fa" dir="rtl" style={{ minHeight: '100vh', background: '#F8F9FA', color: '#0F172A', fontFamily: FONT }}>
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
            ورود
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            رایگان شروع کنید
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
              🌐 100 زبان · بیش از 150 معلم هوش مصنوعی
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 آزمون سطح مکالمه <strong>&nbsp;رایگان</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            مکالمه انگلیسی،
            <br />
            حالا هر روز با معلم هوش مصنوعی
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            بدون رزرو کلاس، بدون خجالت.
            <br />
            از پذیرش پرواز در فرودگاه تا جلسه کاری — بیش از 150 موقعیت واقعی.
            <br />
            اصلاح تلفظ و گزارش بازخورد هم دارد.
            <br />
            قابلیت مکالمه با هوش مصنوعی در اپ‌های خارجی ماهی $29.99 است؛ MunTalk را رایگان شروع کنید.
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
              🚀 رایگان شروع کنید
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              سطحم را بسنج (5 دقیقه)
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 طرح رایگان دارد</span>
            <span>💬 مکالمه هوش مصنوعی در حد Duolingo Max، از $0</span>
            <span>💳 بدون نیاز به ثبت کارت</span>
            <span>⏰ تمرین در هر زمان، 24 ساعته</span>
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
            ['150+', 'معلم هوش مصنوعی', '🤖', '#EFF6FF', '#2563EB'],
            ['100', 'زبان برای یادگیری', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), 'درس', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', 'نظام سطح‌بندی', '🎓', '#FAF5FF', '#7C3AED'],
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
          چرا MunTalk؟
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', 'نقش‌آفرینی در موقعیت‌های واقعی', 'مصاحبه کاری، فرودگاه، جلسه کاری… در بیش از 150 موقعیت مستقیم با معلم هوش مصنوعی گفتگو کنید و یاد بگیرید.'],
              ['🗣️', 'اصلاح تلفظ + گزارش بازخورد', 'بعد از هر گفتگو، اصلاح تلفظ و گزارش بازخورد مفصل دریافت می‌کنید و فوراً می‌فهمید چه چیزی کم دارید.'],
              ['🎯', 'آزمون سطح مکالمه در 5 دقیقه', 'سطح فعلی شما را دقیق تشخیص می‌دهد تا از سطح مناسب شروع کنید. آزمون رایگان است.'],
              ['📚', 'برنامه درسی از A1 تا C2', 'یادگیری گام‌به‌گام بر اساس چارچوب مرجع مشترک اروپایی (CEFR). چه تازه‌کار باشید چه پیشرفته، مسیری برای شما هست.'],
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
          این‌طور شروع کنید
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', 'آزمون سطح', 'فقط در 5 دقیقه سطح مکالمه‌تان را بفهمید.'],
              ['2', 'گفتگو با معلم', 'از میان بیش از 150 معلم هوش مصنوعی، معلم دلخواهتان را انتخاب کنید و گفتگو را شروع کنید.'],
              ['3', 'پیشرفت با بازخورد', 'با اصلاح تلفظ و گزارش‌ها نقاط ضعفتان را برطرف کنید.'],
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
          پرسش‌های متداول
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['واقعاً رایگان است؟', 'بله. می‌توانید بدون ثبت کارت با آزمون سطح و طرح رایگان شروع کنید. اگر درس‌ها و امکانات بیشتری خواستید، طرح Premium را انتخاب کنید.'],
              ['اصلاً انگلیسی بلد نیستم، می‌توانم یاد بگیرم؟', 'حتماً. از دوره Pre-A1 با تطبیق تصویر، شنیدن و تمرین تلفظ، قدم‌به‌قدم شروع کنید.'],
              ['چه فرقی با کلاس آنلاین انگلیسی با معلم دارد؟', 'نیازی به رزرو نیست، 24 ساعته هر وقت خواستید تمرین کنید و از اشتباه کردن خجالت نکشید. بزرگ‌ترین فرق: هر موقعیت را هر چند بار که بخواهید می‌توانید تکرار کنید.'],
              ['به جز انگلیسی، زبان‌های دیگر هم می‌شود یاد گرفت؟', 'بله. 100 زبان از جمله انگلیسی را می‌توانید یاد بگیرید و زبانی را که می‌خواهید یاد بگیرید آزادانه با زبان مادری‌تان ترکیب کنید.'],
            ] as [string, string][]
          ).map(([q, a]) => (
            <div key={q} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: '1px solid #E9ECEF' }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>س. {q}</div>
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
            امروز 10 دقیقه وقت بگذارید و با معلم هوش مصنوعی صحبت کنید
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            ثبت‌نام فقط 1 دقیقه طول می‌کشد. بدون کارت، همین حالا شروع کنید.
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
            🚀 رایگان شروع کنید
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · یادگیری زبان با هوش مصنوعی</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>راهنما</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>طرح‌ها</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>سیاست حریم خصوصی</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>شرایط استفاده</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
