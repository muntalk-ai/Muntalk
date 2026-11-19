# QA 11-16 bundle 5 progress (worktree ~/workspace/muntalk-qa16-b5, branch qa/11-16-b5-guest-home, base f460142)

- [x] D18 (MunTalk guest home zero-progress) — committed 442c642, pushed. LevelHub.tsx: nav/mobile streak-XP pills hidden for guests; Current Level guest variant ("Start your first lesson"); free-user Continue/Review CTA gated to signed-in; guest welcome card added. Level-grid session progress untouched.
- [x] D8 (hero right side empty) — committed, pushed. LevelHub.tsx heroBanner: 2x2 collage of existing /images/t01-t04.jpg (Alexis/Myra/Alyssa/Aubrey) + "Meet your AI tutors" chip, desktop-only (.mt-hero-visual, hidden <1025px). No new art.
- [x] Muntuz D26 (MV fullscreen does nothing) — committed, pushed. MuntuzGroupClient.tsx: enterMvFullscreen rewritten as fallback chain (video.requestFullscreen -> webkitEnterFullscreen -> dialog-container fullscreen -> CSS viewport-expand fallback) + toggle off + fullscreenchange label sync. Root cause: old code swallowed the requestFullscreen rejection (iframe w/o allowfullscreen). Needs Jay phone check (fullscreen not click-testable headlessly).
- [ ] Local dummy-env build — node_modules copied from main checkout (npm install failed with tar -122; copy works, Next 14.2.3). Run next. - [ ] PR + Vercel Preview verification. DO NOT MERGE.
- [ ] PR + Vercel Preview verification. DO NOT MERGE.
