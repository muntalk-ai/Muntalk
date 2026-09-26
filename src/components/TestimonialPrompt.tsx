'use client';

import { useState } from 'react';
import { submitTestimonial, MAX_TESTIMONIAL_TEXT } from '@/lib/testimonials';

interface Props {
  uid: string;
  displayName: string;
  onDone: () => void; // called on submit or dismiss (sets the "asked" flag upstream)
}

export default function TestimonialPrompt({ uid, displayName, onDone }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) { setError('Write a line or two first — even a short one helps!'); return; }
    setSending(true); setError('');
    try {
      await submitTestimonial(uid, displayName, text);
      setSent(true);
    } catch {
      setError('Couldn\'t save your review — check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={onDone}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', width: '92vw', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', fontFamily: "'Nunito',sans-serif", textAlign: 'center' }}>
        {sent ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>Thank you!</h2>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600, lineHeight: 1.7, margin: '0 0 20px' }}>
              Your words help other learners find the courage to start speaking.
            </p>
            <button onClick={onDone}
              style={{ padding: '12px 32px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
              Keep Learning →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#6366F1', letterSpacing: 2, marginBottom: 8 }}>10 LESSONS COMPLETE</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>You&apos;re on a roll!</h2>
            <p style={{ fontSize: 14, color: '#64748B', fontWeight: 600, lineHeight: 1.7, margin: '0 0 18px' }}>
              Quick favor — in one line, how&apos;s MunTalk working for you so far?
              Your review helps new learners trust the journey.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_TESTIMONIAL_TEXT))}
              placeholder="e.g. The speaking practice finally got me talking without freezing up!"
              rows={3}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none', resize: 'none', marginBottom: 6, boxSizing: 'border-box' }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 12 }}>
              {text.length}/{MAX_TESTIMONIAL_TEXT}
            </div>
            {error && <div style={{ fontSize: 13, color: '#DC2626', fontWeight: 700, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSubmit} disabled={sending}
                style={{ flex: 1, padding: '13px', borderRadius: 14, border: 'none', background: sending ? '#C7D2FE' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', fontWeight: 900, fontSize: 14, cursor: sending ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                {sending ? 'Saving…' : 'Share My Review 💬'}
              </button>
              <button onClick={onDone}
                style={{ padding: '13px 20px', borderRadius: 14, border: '2px solid #E5E7EB', background: '#fff', color: '#6B7280', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>
                Skip
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginTop: 12 }}>
              Posted as &ldquo;{displayName}&rdquo; · Only shown publicly if you submit
            </div>
          </>
        )}
      </div>
    </div>
  );
}
