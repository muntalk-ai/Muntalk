# QA 11-16 bundle 5 progress (worktree ~/workspace/muntalk-qa16-b5, branch qa/11-16-b5-guest-home, base f460142)

- [x] D18 (MunTalk guest home zero-progress) — committed 442c642, pushed. LevelHub.tsx: nav/mobile streak-XP pills hidden for guests; Current Level guest variant ("Start your first lesson"); free-user Continue/Review CTA gated to signed-in; guest welcome card added. Level-grid session progress untouched.
- [ ] D8 (hero right side empty) — NOT STARTED. Plan: tutor-thumbnail collage (existing /images/t01-t04.jpg) in heroBanner, desktop-only via .mt-hero-visual media query in LevelHub.tsx style block.
- [ ] Muntuz D26 (MV fullscreen does nothing) — NOT STARTED. Plan: rewrite enterMvFullscreen in src/app/muntuz/group/MuntuzGroupClient.tsx — try video.requestFullscreen, then webkitEnterFullscreen (iOS), then dialog-container fullscreen, then CSS-expand fallback (mvExpanded state) so the button always visibly does something; toggle to exit.
- [ ] Local dummy-env build (needs npm install first — no node_modules in worktree yet).
- [ ] PR + Vercel Preview verification. DO NOT MERGE.
