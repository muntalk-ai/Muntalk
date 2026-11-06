// Shared early-access gating for the /watch hub (Jay 2026-11-06).
//
// One rule for both series — Text Adventure and Konglish ER:
//   released — release time has passed: free for everyone, no sign-in.
//   early    — the next episode, 1–2 days before release: members only.
//              Signed-in users can watch it if a video exists.
//   upcoming — further out: release date only, no video.
//
// How each series computes its status (data shapes differ):
//   Konglish ER: fixed releaseAt per episode; early = within 48h before
//     release (see episodeStatus in src/data/konglish-episodes.ts).
//   Text Adventure: released = publicDate is set and past; early = not
//     released yet but at least one Unlisted video exists (see
//     textAdventureStatus in src/data/text-adventure-episodes.ts).
//     An episode with no videos and no publicDate is upcoming.
//
// Workflow note (Jay 2026-11-06): for the early-access section to have
// anything to show, upload the next episode as Unlisted 1–2 days BEFORE
// its release time and flip it to Public at release. Until that workflow
// runs, early episodes show a "video is being prepared" card.

export type GateStatus = 'released' | 'early' | 'upcoming';

// Early access opens 48h before release (Konglish ER window).
export const EARLY_WINDOW_MS = 48 * 60 * 60 * 1000;

export function gateStatus(
  releaseAt: string | null | undefined,
  now: number = Date.now(),
): GateStatus {
  if (!releaseAt) return 'upcoming';
  const release = Date.parse(releaseAt);
  if (Number.isNaN(release)) return 'upcoming';
  if (now >= release) return 'released';
  if (now >= release - EARLY_WINDOW_MS) return 'early';
  return 'upcoming';
}

// "Nov 8, 3:00 PM" in Vancouver time — the clock Jay schedules by.
export function fmtRelease(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Vancouver',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
