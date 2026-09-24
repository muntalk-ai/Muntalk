// components/CertificateModal.tsx
// CEFR 수료증 발급 축하 모달 + SNS 공유

'use client';

import { useState } from 'react';
import type { Certificate } from '@/lib/certificates';

export default function CertificateModal({
  cert,
  onClose,
}: {
  cert: Certificate;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const shareText = `I just earned my ${cert.label} English certificate on MunTalk! ${cert.badge} Free AI language learning — come beat my streak: https://muntalk.com`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://muntalk.com')}`;

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      fontFamily: "'Nunito',sans-serif",
    }}>
      <div style={{
        background: '#fff', borderRadius: 28, padding: '40px 36px', maxWidth: 420, width: '100%',
        textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 장식 */}
        <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: '#FEF3C7', opacity: 0.6 }} />
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 160, height: 160, borderRadius: '50%', background: '#DBEAFE', opacity: 0.6 }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>🎓</div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', letterSpacing: 2.5, marginBottom: 10 }}>
            CERTIFICATE OF COMPLETION
          </div>

          {/* 수료증 카드 */}
          <div style={{
            border: '2px solid #F59E0B', borderRadius: 20, padding: '24px 20px',
            background: 'linear-gradient(135deg,#FFFBEB,#FFF7ED)', marginBottom: 20,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
              This certifies that
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>
              {cert.learnerName}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 10 }}>
              has successfully completed
            </div>
            <div style={{ fontSize: 40, marginBottom: 4 }}>{cert.badge}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#B45309' }}>
              English {cert.label}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginTop: 10 }}>
              {cert.awardedAt} · {cert.certId}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16 }}>
            링크드인에 추가하고 실력을 증명하세요 💼
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <a href={xUrl} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#0F172A', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
              𝕏 공유하기
            </a>
            <a href={linkedInUrl} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#0A66C2', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
              in LinkedIn
            </a>
            <button onClick={copyText}
              style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#F1F5F9', color: '#334155', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              {copied ? '✅ 복사됨' : '📋 복사'}
            </button>
          </div>

          <button onClick={onClose}
            style={{ width: '100%', padding: '12px', borderRadius: 14, border: 'none', background: 'none', color: '#94A3B8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
            계속 학습하기 →
          </button>
        </div>
      </div>
    </div>
  );
}
