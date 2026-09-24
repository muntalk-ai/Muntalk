import type { Metadata } from 'next';
import { CURRICULUM } from '@/data/curriculum';

export const metadata: Metadata = {
  title: 'MunTalk — AI 영어 회화 | 무료 스피킹 연습',
  description:
    'AI 튜터와 매일 영어 회화. 150개 이상의 실전 상황극, 발음 교정, 스피킹 레벨 테스트 무료. 카드 등록 없이 시작하세요.',
};

const FONT = "'Nunito','Noto Sans KR',-apple-system,sans-serif";

export default function KoreanLanding() {
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
          <span style={{ background: '#EFF6FF', color: '#38BDF8', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
            BETA
          </span>
        </a>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a
            href="/login"
            style={{ padding: '8px 16px', borderRadius: 20, color: '#475569', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
          >
            로그인
          </a>
          <a
            href="/signup"
            style={{
              padding: '9px 20px', borderRadius: 20, border: 'none',
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
              fontSize: 13, fontWeight: 900, textDecoration: 'none',
            }}
          >
            무료로 시작하기
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
              🌐 100개 언어 · 150명+ AI 튜터
            </span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff',
                borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 900, color: '#7C3AED',
              }}
            >
              🎯 스피킹 레벨 테스트 <strong>&nbsp;무료</strong>
            </span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.3, margin: '0 0 16px', color: '#fff', letterSpacing: '-1px' }}>
            영어 회화,
            <br />
            이젠 AI 튜터와 매일 하세요
          </h1>
          <p style={{ opacity: 0.92, fontSize: 16, lineHeight: 1.8, margin: '0 0 36px', color: '#fff', fontWeight: 600 }}>
            전화영어 예약도, 학원 눈치도 필요 없습니다.
            <br />
            공항 체크인부터 비즈니스 미팅까지 150개 이상의 실전 상황극.
            <br />
            발음 교정과 피드백 리포트는 기본으로 드립니다.
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
              🚀 무료로 시작하기
            </a>
            <a
              href="/lingua/placement?lang=en-US"
              style={{
                background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: 14, padding: '14px 26px', fontWeight: 800, fontSize: 15,
                textDecoration: 'none', fontFamily: FONT,
              }}
            >
              내 레벨 알아보기 (5분)
            </a>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28, fontSize: 13, fontWeight: 700, opacity: 0.9 }}>
            <span>🆓 무료 플랜 제공</span>
            <span>💳 카드 등록 불필요</span>
            <span>⏰ 24시간 언제든 연습</span>
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
            ['150+', 'AI 튜터', '🤖', '#EFF6FF', '#2563EB'],
            ['100', '학습 언어', '🌍', '#F0FDF4', '#16A34A'],
            [String(totalLessons), '레슨', '📚', '#FFF7ED', '#EA580C'],
            ['A1→C2', '레벨 체계', '🎓', '#FAF5FF', '#7C3AED'],
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
          왜 MunTalk인가요?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
          {(
            [
              ['🎭', '실전 상황극 롤플레이', '면접, 공항, 비즈니스 미팅… 150개 이상의 상황에서 AI 튜터와 직접 대화하며 익힙니다.'],
              ['🗣️', '발음 교정 + 피드백 리포트', '대화가 끝나면 발음 교정과 상세 피드백 리포트를 받습니다. 뭐가 부족했는지 바로 알 수 있어요.'],
              ['🎯', '5분 스피킹 레벨 테스트', '현재 실력을 정확히 진단하고 딱 맞는 레벨부터 시작합니다. 테스트는 무료입니다.'],
              ['📚', 'A1부터 C2까지 커리큘럼', '유럽 공통 언어 기준(CEFR)에 맞춘 체계적인 단계별 학습. 왕초보도, 고급자도 갈 길이 있습니다.'],
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
          이렇게 시작하세요
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18 }}>
          {(
            [
              ['1', '레벨 테스트', '5분이면 내 스피킹 레벨을 알 수 있어요.'],
              ['2', '튜터와 대화', '150명+ AI 튜터 중 마음에 드는 튜터를 골라 대화를 시작하세요.'],
              ['3', '피드백으로 성장', '발음 교정과 리포트로 부족한 부분을 채워가세요.'],
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
          자주 묻는 질문
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(
            [
              ['정말 무료인가요?', '네. 레벨 테스트와 무료 플랜으로 시작할 수 있고, 카드 등록도 필요 없습니다. 더 많은 레슨과 기능이 필요하면 프리미엄 플랜을 선택하시면 됩니다.'],
              ['영어를 전혀 못해도 되나요?', '물론입니다. Pre-A1 스타터 과정부터 그림 맞추기, 듣기, 발음 연습으로 차근차근 시작할 수 있어요.'],
              ['전화영어랑 뭐가 다른가요?', '예약 없이 24시간 언제든 연습할 수 있고, 틀려도 눈치 볼 필요가 없습니다. 같은 상황을 무제한으로 반복 연습할 수 있는 게 가장 큰 차이예요.'],
              ['영어 말고 다른 언어도 되나요?', '네. 영어 포함 100개 언어를 배울 수 있습니다. 배우고 싶은 언어와 모국어를 자유롭게 조합하세요.'],
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
            오늘 10분, AI 튜터와 대화해 보세요
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: '0 0 32px', fontWeight: 600 }}>
            가입은 1분이면 됩니다. 카드 등록 없이 바로 시작할 수 있어요.
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
            🚀 무료로 시작하기
          </a>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: 13, borderTop: '1px solid #E9ECEF', background: '#fff' }}>
        <div style={{ marginBottom: 12 }}>🌐 MunTalk · AI와 함께하는 언어 학습</div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <a href="/faq" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>도움말</a>
          <a href="/pricing" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>요금제</a>
          <a href="/privacy" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>개인정보처리방침</a>
          <a href="/terms" style={{ color: '#6366F1', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>이용약관</a>
        </div>
        <div style={{ fontSize: 11, color: '#CBD5E1' }}>
          &copy; {new Date().getFullYear()} MunTalk. All rights reserved. |{' '}
          <a href="mailto:muntalkofficial@gmail.com" style={{ color: '#94A3B8', textDecoration: 'none' }}>muntalkofficial@gmail.com</a>
        </div>
      </footer>
    </div>
  );
}
