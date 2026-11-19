# QA 11-16 guest batch 1 — progress (branch `qa/11-16-b1-auth`, base f460142)

Resumability log: one line per item, with the commit that landed it.
If interrupted, resume from the last commit listed here.

- [x] Item 3 — MunTalk D17 (/login "Checking sign-in status..." lingers): `getRedirectResult()` effect now has a 5s timeout fallback that always clears `redirectChecking`, and the status line only renders while `authLoading` is still true, so it disappears once the auth check completes. File: `src/app/login/page.tsx` (redirect effect + status render). Commit: `QA 11-16 B1: stop login status text lingering (D17)`.
