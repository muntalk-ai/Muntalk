// /konglish now redirects to the Konglish ER tab of the /watch hub
// (Jay 2026-11-06 — one page, two series). The old URL keeps working:
// https://www.muntalk.com/konglish lands on /watch?tab=konglish.
import { redirect } from 'next/navigation';

export default function KonglishPage() {
  redirect('/watch?tab=konglish');
}
