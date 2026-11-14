import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — ฝึกพูดภาษาอังกฤษกับ AI | ฝึกพูดฟรี',
  description:
    'ฝึกพูดภาษาอังกฤษทุกวันกับติวเตอร์ AI มากกว่า 150 บทบาทสมมติในชีวิตจริง แก้ไขการออกเสียง ทดสอบระดับการพูดฟรี ไม่ต้องใช้บัตรเครดิต',
  alternates: {
    canonical: '/th',
    languages: {
      en: '/',
      ko: '/ko',
      vi: '/vi',
      th: '/th',
      my: '/my',
      es: '/es',
      ja: '/ja',
      'x-default': '/',
    },
  },
};

const FONT = "'Nunito','Noto Sans Thai',-apple-system,sans-serif";

export default function ThaiLanding() {
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
            เข้าสู่ระบบ
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            เริ่มฟรี
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
              🌐 100 ภาษา · ติวเตอร์ AI 150+ คน
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 ทดสอบระดับการพูด <strong>&nbsp;ฟรี</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            พูดภาษาอังกฤษ
            <br />
            ฝึกทุกวันกับติวเตอร์ AI ได้แล้ววันนี้
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            ไม่ต้องจองคลาส ไม่ต้องเกรงใจใคร
            <br />
            ตั้งแต่เช็กอินที่สนามบินถึงประชุมธุรกิจ — มากกว่า 150 สถานการณ์จริง
            <br />
            แก้ไขการออกเสียงและรายงานฟีดแบ็กมีให้เป็นพื้นฐาน
            <br />
            ฟีเจอร์สนทนา AI ของแอปต่างประเทศราคา $29.99/เดือน MunTalk เริ่มฟรี
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
              🚀 เริ่มฟรี
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              รู้ระดับของฉัน (5 นาที)
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 มีแพลนฟรี</span>
            <span>💬 สนทนา AI ระดับ Duolingo Max เริ่มที่ $0</span>
            <span>💳 ไม่ต้องลงทะเบียนบัตร</span>
            <span>⏰ ฝึกได้ตลอด 24 ชั่วโมง</span>
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
            ['150+', 'ติวเตอร์ AI', '🤖', '#EFF6FF', '#2563EB'],
            ['100', 'ภาษาที่เรียน', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), 'บทเรียน', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', 'ระบบระดับ', '🎓', '#FAF5FF', '#7C3AED'],
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
          ทำไมต้อง MunTalk?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', 'โรลเพลย์สถานการณ์จริง', 'สัมภาษณ์งาน สนามบิน ประชุมธุรกิจ… ฝึกพูดคุยกับติวเตอร์ AI โดยตรงในสถานการณ์มากกว่า 150 แบบ'],
              ['🗣️', 'แก้ไขการออกเสียง + รายงานฟีดแบ็ก', 'หลังสนทนา คุณจะได้รับแก้ไขการออกเสียงและรายงานฟีดแบ็กโดยละเอียด รู้ทันทีว่ายังขาดตรงไหน'],
              ['🎯', 'ทดสอบระดับการพูดใน 5 นาที', 'วัดระดับปัจจุบันอย่างแม่นยำและเริ่มจากระดับที่เหมาะกับคุณ ทดสอบฟรี'],
              ['📚', 'หลักสูตรตั้งแต่ A1 ถึง C2', 'เรียนเป็นขั้นตามกรอบมาตรฐานยุโรป (CEFR) ไม่ว่าจะเพิ่งเริ่มหรือเก่งแล้วก็มีเส้นทางให้เดินต่อ'],
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
          เริ่มแบบนี้
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', 'ทดสอบระดับ', 'แค่ 5 นาทีก็รู้ระดับการพูดของตัวเอง'],
              ['2', 'คุยกับติวเตอร์', 'เลือกติวเตอร์ที่ชอบจากติวเตอร์ AI 150+ คนแล้วเริ่มคุยได้เลย'],
              ['3', 'พัฒนาด้วยฟีดแบ็ก', 'เติมเต็มจุดอ่อนด้วยการแก้ไขการออกเสียงและรายงาน'],
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
          คำถามที่พบบ่อย
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['ฟรีจริงหรือ?', 'ใช่ คุณสามารถเริ่มได้ด้วยทดสอบระดับและแพลนฟรี ไม่ต้องลงทะเบียนบัตร ถ้าต้องการบทเรียนและฟีเจอร์เพิ่มค่อยเลือกแพลนพรีเมียม'],
              ['พูดอังกฤษไม่ได้เลย เรียนได้ไหม?', 'ได้แน่นอน เริ่มจากคอร์ส Pre-A1 ด้วยการจับคู่ภาพ ฟัง และฝึกออกเสียง ทีละขั้น'],
              ['ต่างจากเรียนภาษาอังกฤษทางโทรศัพท์อย่างไร?', 'ไม่ต้องจอง ฝึกได้ตลอด 24 ชั่วโมง พูดผิดก็ไม่ต้องอาย และฝึกสถานการณ์เดิมซ้ำได้ไม่จำกัดครั้ง นี่คือความต่างที่ใหญ่ที่สุด'],
              ['เรียนภาษาอื่นนอกจากภาษาอังกฤษได้ไหม?', 'ได้ เรียนได้ 100 ภาษารวมภาษาอังกฤษ จับคู่ภาษาที่อยากเรียนกับภาษาแม่ได้อย่างอิสระ'],
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
            วันนี้ 10 นาที ลองคุยกับติวเตอร์ AI ดู
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            สมัครใช้เวลาแค่ 1 นาที เริ่มได้ทันทีโดยไม่ต้องลงทะเบียนบัตร
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
            🚀 เริ่มฟรี
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · เรียนภาษากับ AI</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>ช่วยเหลือ</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>แพ็กเกจ</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>นโยบายความเป็นส่วนตัว</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>ข้อกำหนดการใช้งาน</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
