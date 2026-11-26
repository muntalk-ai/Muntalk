// lib/panelAdmin.ts — server-side admin check for the admin panels (2026-11-26).
// Same two admins the /admin page already allows on the client (PR #242,
// "both as admin"), plus anything in the ADMIN_EMAILS env used by apiGuard.
import { isAdminEmail } from '@/lib/apiGuard';

export const PANEL_ADMINS = ['muntalkofficial@gmail.com', 'muntuz.official@gmail.com'];

export function isPanelAdmin(email?: string): boolean {
  if (!email) return false;
  return PANEL_ADMINS.includes(email.toLowerCase()) || isAdminEmail(email);
}
