import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — Học tiếng Anh với AI | Luyện nói miễn phí',
  description:
    'Luyện nói tiếng Anh mỗi ngày với gia sư AI. Hơn 150 tình huống thực tế, sửa phát âm, kiểm tra trình độ nói miễn phí. Bắt đầu ngay, không cần thẻ.',
  alternates: {
    canonical: '/vi',
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

const FONT = "'Nunito','Noto Sans',-apple-system,sans-serif";

export default function VietnameseLanding() {
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
            Đăng nhập
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            Bắt đầu miễn phí
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
              🌐 100 ngôn ngữ · 150+ gia sư AI
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 Kiểm tra trình độ nói <strong>&nbsp;miễn phí</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            Nói tiếng Anh,
            <br />
            giờ đây luyện mỗi ngày cùng gia sư AI
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            Không cần đặt lịch học, không cần ngại ngùng.
            <br />
            Từ làm thủ tục ở sân bay đến họp công việc — hơn 150 tình huống thực tế.
            <br />
            Sửa phát âm và báo cáo phản hồi đã có sẵn.
            <br />
            Tính năng hội thoại AI của ứng dụng nước ngoài giá $29,99/tháng, MunTalk bắt đầu miễn phí.
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
              🚀 Bắt đầu miễn phí
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              Xem trình độ của tôi (5 phút)
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 Có gói miễn phí</span>
            <span>💬 Hội thoại AI ngang Duolingo Max, từ $0</span>
            <span>💳 Không cần đăng ký thẻ</span>
            <span>⏰ Luyện tập bất cứ lúc nào, 24 giờ</span>
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
            ['150+', 'Gia sư AI', '🤖', '#EFF6FF', '#2563EB'],
            ['100', 'Ngôn ngữ học', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), 'Bài học', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', 'Khung trình độ', '🎓', '#FAF5FF', '#7C3AED'],
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
          Tại sao chọn MunTalk?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', 'Nhập vai tình huống thực tế', 'Phỏng vấn, sân bay, họp công việc… trò chuyện trực tiếp với gia sư AI trong hơn 150 tình huống để học.'],
              ['🗣️', 'Sửa phát âm + báo cáo phản hồi', 'Sau mỗi cuộc trò chuyện, bạn nhận được phần sửa phát âm và báo cáo phản hồi chi tiết. Bạn biết ngay mình còn thiếu gì.'],
              ['🎯', 'Kiểm tra trình độ nói trong 5 phút', 'Chẩn đoán chính xác trình độ hiện tại và bắt đầu đúng cấp độ. Kiểm tra miễn phí.'],
              ['📚', 'Giáo trình từ A1 đến C2', 'Học theo từng cấp độ, theo Khung tham chiếu châu Âu (CEFR). Dù mới bắt đầu hay đã giỏi, bạn đều có lộ trình.'],
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
          Bắt đầu như thế này
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', 'Kiểm tra trình độ', 'Chỉ 5 phút là biết trình độ nói của mình.'],
              ['2', 'Trò chuyện với gia sư', 'Chọn gia sư yêu thích trong số 150+ gia sư AI và bắt đầu trò chuyện.'],
              ['3', 'Tiến bộ nhờ phản hồi', 'Lấp đầy điểm yếu bằng phần sửa phát âm và báo cáo.'],
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
          Câu hỏi thường gặp
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['Thật sự miễn phí sao?', 'Đúng vậy. Bạn có thể bắt đầu với bài kiểm tra trình độ và gói miễn phí, không cần đăng ký thẻ. Khi cần thêm bài học và tính năng, hãy chọn gói Premium.'],
              ['Tôi chưa biết chút tiếng Anh nào, có học được không?', 'Được chứ. Bắt đầu từ khóa Pre-A1 với ghép hình, nghe và luyện phát âm, từng bước một.'],
              ['Khác gì học tiếng Anh qua điện thoại?', 'Không cần đặt lịch, luyện tập bất cứ lúc nào trong 24 giờ, sai cũng không ngại. Điểm khác lớn nhất là bạn có thể luyện lại cùng một tình huống bao nhiêu lần tùy thích.'],
              ['Ngoài tiếng Anh còn học ngôn ngữ khác được không?', 'Được. Bạn có thể học 100 ngôn ngữ, kể cả tiếng Anh. Tự do kết hợp ngôn ngữ muốn học với tiếng mẹ đẻ của bạn.'],
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
            Dành 10 phút hôm nay, trò chuyện với gia sư AI
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            Đăng ký chỉ mất 1 phút. Bắt đầu ngay, không cần đăng ký thẻ.
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
            🚀 Bắt đầu miễn phí
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#6B7280', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · Học ngôn ngữ cùng AI</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Trợ giúp</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Gói cước</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Chính sách bảo mật</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Điều khoản sử dụng</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
