// app/api/referral/resolve/route.ts — 추천 코드 → 추천인 표시 이름 (공개, PR #114)
// /r/{code} 랜딩에서 "누가 초대했는지" 표시용. 코드 자체가 공개 링크이므로
// displayName 공개는 문제없음. 그 외 정보는 반환하지 않음.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/serverAuth';
import { isValidReferralCode } from '@/lib/referral';

/** GET /api/referral/resolve?code=XXXXXXXX */
export async function GET(req: NextRequest) {
  try {
    const code = new URL(req.url).searchParams.get('code');
    if (!isValidReferralCode(code)) {
      return NextResponse.json({ ok: false });
    }
    const snap = await getAdminDb().doc(`referral_codes/${code}`).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false });
    }
    const displayName = (snap.data()?.displayName as string) || 'A friend';
    return NextResponse.json({ ok: true, displayName });
  } catch (e) {
    console.error('[referral/resolve] failed:', (e as Error).message);
    return NextResponse.json({ ok: false });
  }
}
