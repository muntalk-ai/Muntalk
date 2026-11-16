// Host-scoped branding (QA H-4 / Q8).
// muntuz.com shows "Muntuz" + muntuz.official@gmail.com; every other host
// (muntalk.com, vercel.app previews, localhost) keeps "MunTalk" +
// muntalkofficial@gmail.com. Same host rule as src/middleware.ts.
// Pure helpers only (no hooks) so server code (generateMetadata) can use them too.

export const MUNTALK_BRAND = {
  name: 'MunTalk',
  email: 'muntalkofficial@gmail.com',
  domain: 'www.muntalk.com',
} as const;

export const MUNTUZ_BRAND = {
  name: 'Muntuz',
  email: 'muntuz.official@gmail.com',
  domain: 'muntuz.com',
} as const;

export type Brand = typeof MUNTALK_BRAND | typeof MUNTUZ_BRAND;

export function isMuntuzHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.split(':')[0].toLowerCase();
  return h === 'muntuz.com' || h === 'www.muntuz.com';
}

export function brandForHost(host: string | null | undefined): Brand {
  return isMuntuzHost(host) ? MUNTUZ_BRAND : MUNTALK_BRAND;
}

/** Swap hardcoded MunTalk brand mentions in a static string for the active brand. */
export function brandifyText(text: string, brand: Brand): string {
  if (brand.name === 'MunTalk') return text;
  return text
    .split('muntalkofficial@gmail.com').join(brand.email)
    .split('muntalk.com').join(brand.domain)
    .split('MunTalk').join(brand.name);
}
