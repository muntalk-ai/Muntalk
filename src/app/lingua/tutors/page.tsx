'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { TUTORS, Tutor } from '@/data/tutors';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/lib/userProfile';

type GenderFilter = 'all' | 'female' | 'male';

export default function TutorsPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [search,       setSearch]       = useState('');
  const [gender,       setGender]       = useState<GenderFilter>('all');
  const [currentId,    setCurrentId]    = useState<string>('t01');   // 저장된 튜터
  const [pendingTutor, setPendingTutor] = useState<Tutor | null>(null); // 클릭한 튜터
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  // 현재 저장된 튜터 ID 불러오기
  useEffect(() => {
    const id = localStorage.getItem('mt_tutor_id') || 't01';
    setCurrentId(id);
  }, []);

  const filtered = TUTORS.filter(t => {
    const matchGender = gender === 'all' || t.gender === gender;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchGender && matchSearch;
  });

  const handleSelect = async () => {
    if (!pendingTutor || saving) return;
    setSaving(true);
    try {
      localStorage.setItem('mt_tutor_id', pendingTutor.id);
      setCurrentId(pendingTutor.id);
      if (user) {
        await updateUserProfile(user.uid, { tutorId: pendingTutor.id });
        await refreshProfile(); // AuthContext profile 즉시 갱신
      }
      setSaved(true);
      setTimeout(() => {
        router.push('/lingua');
      }, 600);
    } catch (e) {
      console.error('Failed to save tutor:', e);
      setSaving(false);
    }
  };

  const currentTutor = TUTORS.find(t => t.id === currentId);
  const displayTutor = pendingTutor || currentTutor;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Nunito', sans-serif", paddingBottom: 120 }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `
        .tutor-card { transition: all .15s ease; }
        .tutor-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
      ` }} />

      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', height: 62, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, position: 'sticky', top: 0, zIndex: 200 }}>
        <button onClick={() => router.push('/lingua')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#64748B' }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>👩‍🏫 Choose Tutor</div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: '#94A3B8', fontWeight: 700 }}>{filtered.length} tutors</div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* Current tutor banner */}
        {currentTutor && (
          <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: currentTutor.gender === 'female' ? 'linear-gradient(135deg,#F9A8D4,#C084FC)' : 'linear-gradient(135deg,#93C5FD,#6EE7B7)', flexShrink: 0 }}>
              <img src={currentTutor.thumbnail} alt={currentTutor.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
                onError={e => { (e.currentTarget.parentElement as HTMLDivElement).innerHTML = `<span style="font-size:22px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${currentTutor.gender === 'female' ? '👩' : '👨'}</span>`; }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#1D4ED8' }}>Current tutor: {currentTutor.name}</div>
              <div style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }}>Click any tutor below to switch</div>
            </div>
          </div>
        )}

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '0 0 6px', letterSpacing: -0.8 }}>
          Pick Your Tutor
        </h1>
        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 24px', fontWeight: 700 }}>
          152 AI tutors — any language, any level
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by name..."
            style={{ flex: 1, minWidth: 200, padding: '11px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', fontSize: 14, fontFamily: "'Nunito',sans-serif", outline: 'none', background: '#fff' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'female', 'male'] as GenderFilter[]).map(g => (
              <button key={g} onClick={() => setGender(g)}
                style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid', borderColor: gender === g ? '#2563EB' : '#E5E7EB', background: gender === g ? '#EFF6FF' : '#fff', color: gender === g ? '#2563EB' : '#64748B', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {g === 'all' ? '👥 All' : g === 'female' ? '👩 Female' : '👨 Male'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 12 }}>
          {filtered.map(tutor => {
            const isCurrent  = tutor.id === currentId;
            const isPending  = tutor.id === pendingTutor?.id;
            const isHighlight = isPending || (!pendingTutor && isCurrent);
            return (
              <div key={tutor.id} className="tutor-card"
                onClick={() => setPendingTutor(tutor)}
                style={{
                  background: isHighlight ? '#EFF6FF' : '#fff',
                  borderRadius: 18,
                  border: `2px solid ${isPending ? '#2563EB' : isCurrent ? '#93C5FD' : '#F1F5F9'}`,
                  padding: '18px 14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  position: 'relative',
                }}>
                {isCurrent && !isPending && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#3B82F6', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 8 }}>
                    CURRENT
                  </div>
                )}
                {isPending && (
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#2563EB', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 8 }}>
                    SELECTED
                  </div>
                )}
                <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 10px', overflow: 'hidden', background: tutor.gender === 'female' ? 'linear-gradient(135deg,#F9A8D4,#C084FC)' : 'linear-gradient(135deg,#93C5FD,#6EE7B7)' }}>
                  <img src={tutor.thumbnail} alt={tutor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%', display: 'block' }}
                    onError={e => { const el = e.currentTarget; el.style.display = 'none'; (el.parentElement as HTMLDivElement).innerHTML = `<span style="font-size:28px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${tutor.gender === 'female' ? '👩' : '👨'}</span>`; }}
                  />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', marginBottom: 3 }}>{tutor.name}</div>
                <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, marginBottom: 5 }}>{tutor.id.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4, fontWeight: 600 }}>{tutor.bio}</div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94A3B8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No tutors found</div>
          </div>
        )}
      </div>

      {/* Bottom action bar — 튜터 클릭하면 표시 */}
      {pendingTutor && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E5E7EB', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 -4px 24px rgba(0,0,0,0.1)', zIndex: 300 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: pendingTutor.gender === 'female' ? 'linear-gradient(135deg,#F9A8D4,#C084FC)' : 'linear-gradient(135deg,#93C5FD,#6EE7B7)', flexShrink: 0 }}>
            <img src={pendingTutor.thumbnail} alt={pendingTutor.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%' }}
              onError={e => { (e.currentTarget.parentElement as HTMLDivElement).innerHTML = `<span style="font-size:20px;display:flex;align-items:center;justify-content:center;width:100%;height:100%">${pendingTutor.gender === 'female' ? '👩' : '👨'}</span>`; }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>{pendingTutor.name}</div>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
              {pendingTutor.id === currentId ? 'Already your tutor' : 'New tutor selected'}
            </div>
          </div>
          <button onClick={() => setPendingTutor(null)}
            style={{ padding: '10px 16px', borderRadius: 12, border: '1.5px solid #E5E7EB', background: '#fff', color: '#64748B', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSelect} disabled={saving}
            style={{ padding: '11px 24px', borderRadius: 12, border: 'none', background: saved ? '#10B981' : saving ? '#93C5FD' : '#2563EB', color: '#fff', fontFamily: "'Nunito',sans-serif", fontWeight: 900, fontSize: 14, cursor: saving ? 'default' : 'pointer', minWidth: 160 }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : pendingTutor.id === currentId ? 'Keep This Tutor →' : 'Confirm Selection →'}
          </button>
        </div>
      )}
    </div>
  );
}
