# QA 11-16 guest batch 1 — progress (branch `qa/11-16-b1-auth`, base f460142)

Resumability log: one line per item, with the commit that landed it.
If interrupted, resume from the last commit listed here.

- [x] Item 4 — MunTalk D19 / Muntuz D14 (⚠️ spacing): audited all 22 `⚠️` sites in src; every error render already carried a literal space, so the QA-observed missing space was hardened with an explicit `{'⚠️ '}` expression (cannot collapse in JSX) on the auth-form error banners: `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/profile/page.tsx`. Lesson/placement renders already spaced, left untouched. Commit: `QA 11-16 B1: harden warning-emoji spacing on auth error banners (D19/D14)`.
