import { NextRequest, NextResponse } from 'next/server';
import {
  getIdentity, checkRateLimit, clientIp, apiError,
} from '@/lib/apiGuard';
import { getAdminDb } from '@/lib/serverAuth';
import { LEARN_LANGUAGES } from '@/data/languages';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Grammar Hub — per-language chapter packs.
// Source priority: Firestore `grammar_cache/{base}` (on-demand packs / corrections)
//   → pre-generated static pack `public/grammar/{base}.json` → 404.
// Regional variants share the base-language pack (es-MX → es, zh-TW → zh, ...).
const baseOf = (code: string) => code.split('-')[0].toLowerCase();
const SUPPORTED = new Set(LEARN_LANGUAGES.map((l) => baseOf(l.code)));

export async function GET(req: NextRequest) {
  try {
    const raw = new URL(req.url).searchParams.get('lang') || 'en-US';
    const base = baseOf(raw);
    if (!SUPPORTED.has(base)) {
      return apiError('Unsupported language', 400);
    }

    // ── PR-F: abuse guards (public learning content — generous limit) ──
    const id = await getIdentity(req);
    const rlKey = id ? `grammar:uid:${id.uid}` : `grammar:ip:${clientIp(req)}`;
    const rl = checkRateLimit(rlKey, 60, 60_000);
    if (!rl.ok) {
      return apiError('Rate limit exceeded', 429, { retryAfterSec: rl.retryAfterSec });
    }

    // 1. Firestore cache — on-demand generated packs and corrections win.
    try {
      const snap = await getAdminDb().collection('grammar_cache').doc(base).get();
      if (snap.exists) {
        const data = snap.data() as { chapters?: unknown[] };
        if (Array.isArray(data.chapters) && data.chapters.length > 0) {
          return NextResponse.json({ chapters: data.chapters, source: 'cache' });
        }
      }
    } catch {
      // Firestore unavailable (e.g. local dev without service account) → static.
    }

    // 2. Pre-generated static pack.
    try {
      const file = await readFile(
        join(process.cwd(), 'public', 'grammar', `${base}.json`),
        'utf8',
      );
      return NextResponse.json({ chapters: JSON.parse(file), source: 'static' });
    } catch {
      return apiError('Grammar pack not available', 404);
    }
  } catch (e) {
    return apiError('Failed to load grammar chapters', 500);
  }
}
