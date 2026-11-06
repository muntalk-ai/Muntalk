'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/subscription';

// ── Muntuz Exchange admin — /exchange/admin ────────────────────────────────
// Direct URL only (not linked from navigation). Admin-only: the admin email
// (src/lib/subscription.ts ADMIN_EMAIL) can view it; everyone else sees a
// notice. Reads real Firestore data: exchange_profiles (signed-in read),
// exchange_reports (admin read — console snippet needed), exchange_waitlist.
// Never shows real names, emails, contacts, or raw birthdates: profiles
// don't store them, and birthdate lives in an owner-only subcollection
// (exchange_profiles/{uid}/private/identity) that this page cannot read.

type AdminTab = 'dashboard' | 'users' | 'reports' | 'waitlist';

type ProfileStatus = 'active' | 'paused' | 'banned';
interface ProfileRow {
  uid: string;
  nickname: string;
  nativeLang: string;
  targetLang: string;
  level: string;
  interests: string[];
  bio: string;
  learningGoal: string;
  country: string;
  gender: string;
  ageBand: string;
  timezone: string;
  availability: string;
  commMode: string;
  correctionPref: string;
  sameGenderOnly: boolean;
  status: ProfileStatus;
  updatedAt: number | null;
}

interface ReportRow {
  id: string;
  reporterUid: string;
  reportedUid: string;
  reportedName: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: number | null;
}

interface WaitlistRow {
  id: string;
  uid: string;
  pair: string;
  pairId: string;
  createdAt: number | null;
}

function tsToMs(v: unknown): number | null {
  if (!v) return null;
  if (typeof v === 'number') return v;
  const t = v as { toMillis?: unknown; seconds?: unknown };
  if (typeof t.toMillis === 'function') return (t.toMillis as () => number)();
  if (typeof t.seconds === 'number') return (t.seconds as number) * 1000;
  return null;
}

function fmtDate(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDateTime(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${fmtDate(ms)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function shortUid(uid: string): string {
  return uid.length > 12 ? `${uid.slice(0, 8)}…` : uid;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

const STATUS_LABEL: Record<ProfileStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  banned: 'Banned',
};
const STATUS_STYLE: Record<ProfileStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-800',
  banned: 'bg-red-100 text-red-700',
};

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'reports', label: 'Reports' },
  { id: 'waitlist', label: 'Waitlist' },
];

export default function ExchangeAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = !!user && isAdminEmail(user.email);

  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reportsError, setReportsError] = useState('');
  const [waitlistError, setWaitlistError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | ProfileStatus>('all');
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState<'open' | 'all' | 'resolved' | 'dismissed'>('open');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoadingData(true);
    setLoadError('');
    setReportsError('');
    setWaitlistError('');
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'exchange_profiles'), limit(200)));
        if (cancelled) return;
        setProfiles(
          snap.docs.map((d) => {
            const v = d.data();
            const av = (v.availability || {}) as { days?: unknown; slots?: unknown; sessionsPerWeek?: unknown };
            const days = strArr(av.days).join(', ');
            const slots = strArr(av.slots).join(', ');
            const sessions = str(av.sessionsPerWeek);
            return {
              uid: d.id,
              nickname: str(v.nickname) || '(no nickname)',
              nativeLang: str(v.nativeLang) || '—',
              targetLang: str(v.targetLang) || '—',
              level: str(v.level) || '—',
              interests: strArr(v.interests),
              bio: str(v.bio),
              learningGoal: str(v.learningGoal) || '—',
              country: str(v.country) || '—',
              gender: str(v.gender) || '—',
              ageBand: str(v.ageBand) || '—',
              timezone: str(v.timezone) || '—',
              availability: [days, slots, sessions ? `${sessions}/week` : ''].filter(Boolean).join(' · ') || '—',
              commMode: str(v.commMode) || '—',
              correctionPref: str(v.correctionPref) || '—',
              sameGenderOnly: v.sameGenderOnly === true,
              status: (v.status === 'paused' || v.status === 'banned' ? v.status : 'active') as ProfileStatus,
              updatedAt: tsToMs(v.updatedAt),
            };
          })
        );
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          (err as { code?: string }).code === 'permission-denied'
            ? '프로필 목록을 불러올 수 없습니다 (권한 없음). Exchange 프로필 읽기 규칙을 확인해주세요.'
            : '프로필 목록을 불러오지 못했습니다.'
        );
      }
      try {
        const snap = await getDocs(
          query(collection(db, 'exchange_reports'), orderBy('createdAt', 'desc'), limit(100))
        );
        if (cancelled) return;
        setReports(
          snap.docs.map((d) => {
            const v = d.data();
            const s = str(v.status);
            return {
              id: d.id,
              reporterUid: str(v.reporterUid),
              reportedUid: str(v.reportedUid),
              reportedName: str(v.reportedName) || '(unknown)',
              reason: str(v.reason) || 'Other',
              status: (s === 'resolved' || s === 'dismissed' ? s : 'open') as ReportRow['status'],
              createdAt: tsToMs(v.createdAt),
            };
          })
        );
      } catch (err) {
        if (cancelled) return;
        setReports([]);
        setReportsError(
          (err as { code?: string }).code === 'permission-denied'
            ? '신고 목록을 불러올 수 없습니다. 콘솔 규칙 스니펫(exchange-admin-phase1)의 exchange_reports 규칙을 게시하면 표시됩니다.'
            : '신고 목록을 불러오지 못했습니다.'
        );
      }
      try {
        const snap = await getDocs(query(collection(db, 'exchange_waitlist'), limit(200)));
        if (cancelled) return;
        setWaitlist(
          snap.docs.map((d) => {
            const v = d.data();
            return {
              id: d.id,
              uid: str(v.uid),
              pair: str(v.pair) || str(v.pairId) || '—',
              pairId: str(v.pairId),
              createdAt: tsToMs(v.createdAt),
            };
          })
        );
      } catch (err) {
        if (cancelled) return;
        setWaitlist([]);
        setWaitlistError(
          (err as { code?: string }).code === 'permission-denied'
            ? '웨이팅리스트를 불러올 수 없습니다. 콘솔 규칙에 관리자 읽기 권한을 추가해주세요.'
            : '웨이팅리스트를 불러오지 못했습니다.'
        );
      }
      if (!cancelled) setLoadingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      totalProfiles: profiles.length,
      new7d: profiles.filter((p) => p.updatedAt !== null && p.updatedAt >= weekAgo).length,
      openReports: reports.filter((r) => r.status === 'open').length,
      waitlistTotal: waitlist.length,
      pausedOrBanned: profiles.filter((p) => p.status !== 'active').length,
    };
  }, [profiles, reports, waitlist]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      if (userStatusFilter !== 'all' && p.status !== userStatusFilter) return false;
      if (!q) return true;
      return (
        p.nickname.toLowerCase().includes(q) ||
        p.nativeLang.toLowerCase().includes(q) ||
        p.targetLang.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.uid.toLowerCase().includes(q)
      );
    });
  }, [profiles, userSearch, userStatusFilter]);

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return reports;
    return reports.filter((r) => r.status === reportFilter);
  }, [reports, reportFilter]);

  const waitlistByPair = useMemo(() => {
    const groups = new Map<string, WaitlistRow[]>();
    for (const w of waitlist) {
      const key = w.pair || w.pairId || '—';
      const list = groups.get(key) || [];
      list.push(w);
      groups.set(key, list);
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [waitlist]);

  const setProfileStatus = async (uid: string, status: ProfileStatus) => {
    setActionBusy(`${uid}:${status}`);
    setActionError('');
    try {
      await setDoc(doc(db, 'exchange_profiles', uid), { status, updatedAt: serverTimestamp() }, { merge: true });
      setProfiles((ps) => ps.map((p) => (p.uid === uid ? { ...p, status } : p)));
      showToast(status === 'active' ? 'Profile re-activated.' : `Profile ${status}.`);
    } catch (err) {
      setActionError(
        (err as { code?: string }).code === 'permission-denied'
          ? '관리자 쓰기 권한이 없습니다. 콘솔 규칙 스니펫(exchange-admin-phase1)의 exchange_profiles 관리자 update 규칙을 게시해주세요.'
          : '상태 변경에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setActionBusy(null);
    }
  };

  const setReportStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    setActionBusy(`${id}:${status}`);
    setActionError('');
    try {
      await setDoc(doc(db, 'exchange_reports', id), { status }, { merge: true });
      setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      showToast(`Report ${status}.`);
    } catch (err) {
      setActionError(
        (err as { code?: string }).code === 'permission-denied'
          ? '신고 처리 권한이 없습니다. 콘솔 규칙 스니펫(exchange-admin-phase1)의 exchange_reports 규칙을 게시해주세요.'
          : '신고 처리에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setActionBusy(null);
    }
  };

  const banFromReport = async (report: ReportRow) => {
    await setProfileStatus(report.reportedUid, 'banned');
    await setReportStatus(report.id, 'resolved');
  };

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-xl font-extrabold">Muntuz Admin</h1>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="font-bold">관리자 전용 페이지입니다.</p>
          <p className="mt-1 text-sm text-slate-500">
            This page is only visible to the Muntuz admin. Sign in with the admin account to continue.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 pb-20">
      <h1 className="text-xl font-extrabold">Muntuz Admin</h1>
      <p className="mt-1 text-sm text-slate-500">
        Exchange admin — users, reports, and waitlist. Signed in as {user?.email}. Real names, emails,
        contacts, and raw birthdates are never shown here.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              tab === t.id ? 'bg-violet-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300'
            }`}
          >
            {t.label}
            {t.id === 'reports' && stats.openReports > 0 && (
              <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-extrabold text-white">
                {stats.openReports}
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {actionError}
        </p>
      )}

      {tab === 'dashboard' && (
        <section>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Exchange profiles', value: stats.totalProfiles },
              { label: 'Active in last 7 days', value: stats.new7d },
              { label: 'Open reports', value: stats.openReports },
              { label: 'Waitlist total', value: stats.waitlistTotal },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          {stats.pausedOrBanned > 0 && (
            <p className="mt-3 text-sm font-semibold text-amber-700">
              {stats.pausedOrBanned} profile(s) currently paused or banned.
            </p>
          )}
          {loadingData && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          {loadError && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {loadError}
            </p>
          )}
          <h2 className="mt-6 text-base font-extrabold">Latest profiles</h2>
          <div className="mt-3 grid gap-3">
            {[...profiles]
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
              .slice(0, 5)
              .map((p) => (
                <div key={p.uid} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{p.nickname}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${STATUS_STYLE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {p.nativeLang} → {p.targetLang} · {p.level} · {p.ageBand} · {p.country} · updated {fmtDate(p.updatedAt)}
                  </p>
                </div>
              ))}
            {profiles.length === 0 && !loadingData && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No Exchange profiles yet.
              </p>
            )}
          </div>
          <h2 className="mt-6 text-base font-extrabold">Open reports</h2>
          <div className="mt-3 grid gap-3">
            {reports
              .filter((r) => r.status === 'open')
              .slice(0, 5)
              .map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="font-bold">{r.reportedName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.reason} · {fmtDateTime(r.createdAt)} · reported user {shortUid(r.reportedUid)}
                  </p>
                </div>
              ))}
            {reports.filter((r) => r.status === 'open').length === 0 && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No open reports.
              </p>
            )}
          </div>
          {reportsError && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {reportsError}
            </p>
          )}
        </section>
      )}

      {tab === 'users' && (
        <section>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search nickname, language, country, or user ID"
              className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <select
              value={userStatusFilter}
              onChange={(e) => setUserStatusFilter(e.target.value as 'all' | ProfileStatus)}
              className="min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-400"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Showing {filteredUsers.length} of {profiles.length} profiles. Birthdates and contact details are
            never stored in profiles and never shown here.
          </p>
          {loadingData && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          {loadError && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {loadError}
            </p>
          )}
          <div className="mt-3 grid gap-3">
            {filteredUsers.map((p) => (
              <article key={p.uid} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{p.nickname}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {p.nativeLang} → {p.targetLang} · {p.level} · {p.ageBand} · {p.gender} · {p.country} ·{' '}
                      {p.timezone}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">ID {shortUid(p.uid)} · updated {fmtDate(p.updatedAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${STATUS_STYLE[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setExpandedUid(expandedUid === p.uid ? null : p.uid)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    {expandedUid === p.uid ? 'Hide profile' : 'View profile'}
                  </button>
                  {p.status === 'active' && (
                    <>
                      <button
                        disabled={actionBusy !== null}
                        onClick={() => setProfileStatus(p.uid, 'paused')}
                        className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60"
                      >
                        Pause
                      </button>
                      <button
                        disabled={actionBusy !== null}
                        onClick={() => setProfileStatus(p.uid, 'banned')}
                        className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
                      >
                        Ban
                      </button>
                    </>
                  )}
                  {p.status !== 'active' && (
                    <button
                      disabled={actionBusy !== null}
                      onClick={() => setProfileStatus(p.uid, 'active')}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
                    >
                      Re-activate
                    </button>
                  )}
                </div>
                {expandedUid === p.uid && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                    {p.bio && <p className="text-slate-600">{p.bio}</p>}
                    <p className="mt-2 text-xs text-slate-500">
                      Goal: {p.learningGoal} · Interests: {p.interests.join(', ') || '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Availability: {p.availability} · Mode: {p.commMode} · Corrections: {p.correctionPref}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Same-gender only: {p.sameGenderOnly ? 'Yes' : 'No'} · Timezone: {p.timezone}
                    </p>
                  </div>
                )}
              </article>
            ))}
            {filteredUsers.length === 0 && !loadingData && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                No profiles match.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === 'reports' && (
        <section>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {(['open', 'all', 'resolved', 'dismissed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setReportFilter(f)}
                aria-pressed={reportFilter === f}
                className={`min-h-[44px] shrink-0 rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  reportFilter === f ? 'bg-violet-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:border-violet-300'
                }`}
              >
                {f === 'open' ? `Open (${reports.filter((r) => r.status === 'open').length})` : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {reportsError && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {reportsError}
            </p>
          )}
          <div className="mt-3 grid gap-3">
            {filteredReports.map((r) => (
              <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">{r.reportedName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.reason} · {fmtDateTime(r.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Reported user {shortUid(r.reportedUid)} · by {shortUid(r.reporterUid)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      r.status === 'open'
                        ? 'bg-red-100 text-red-700'
                        : r.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.status === 'open' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={actionBusy !== null}
                      onClick={() => setReportStatus(r.id, 'resolved')}
                      className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:opacity-60"
                    >
                      Resolve
                    </button>
                    <button
                      disabled={actionBusy !== null}
                      onClick={() => setReportStatus(r.id, 'dismissed')}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                    >
                      Dismiss
                    </button>
                    <button
                      disabled={actionBusy !== null}
                      onClick={() => banFromReport(r)}
                      className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
                    >
                      Ban user &amp; resolve
                    </button>
                  </div>
                )}
              </article>
            ))}
            {filteredReports.length === 0 && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                {reports.length === 0
                  ? 'No reports yet. When a user reports a chat partner, it appears here.'
                  : 'No reports in this filter.'}
              </p>
            )}
          </div>
        </section>
      )}

      {tab === 'waitlist' && (
        <section>
          <p className="mt-4 text-sm text-slate-500">
            {waitlist.length} {waitlist.length === 1 ? 'person' : 'people'} waiting across {waitlistByPair.length}{' '}
            language {waitlistByPair.length === 1 ? 'pair' : 'pairs'}.
          </p>
          {waitlistError && (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {waitlistError}
            </p>
          )}
          <div className="mt-3 grid gap-3">
            {waitlistByPair.map(([pair, rows]) => (
              <div key={pair} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{pair}</p>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-extrabold text-violet-700">
                    {rows.length} waiting
                  </span>
                </div>
                <div className="mt-3 grid gap-1">
                  {[...rows]
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .slice(0, 10)
                    .map((w) => (
                      <p key={w.id} className="text-xs text-slate-500">
                        User {shortUid(w.uid)} · joined {fmtDate(w.createdAt)}
                      </p>
                    ))}
                  {rows.length > 10 && (
                    <p className="text-xs text-slate-400">+ {rows.length - 10} more</p>
                  )}
                </div>
              </div>
            ))}
            {waitlist.length === 0 && !loadingData && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Waitlist is empty.
              </p>
            )}
          </div>
        </section>
      )}

      {toast && (
        <p className="fixed inset-x-4 bottom-6 z-50 mx-auto max-w-md rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
          {toast}
        </p>
      )}
    </main>
  );
}
