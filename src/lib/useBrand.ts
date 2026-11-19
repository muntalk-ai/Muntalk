'use client';

import { useEffect, useState } from 'react';
import { brandForHost, MUNTALK_BRAND, type Brand } from './brand';

// Client pages render on the server first, so the first paint is always the
// MunTalk default; the effect corrects it on muntuz.com after hydration
// (same window.location.hostname pattern as src/app/exchange/page.tsx).
export function useBrand(): Brand {
  const [brand, setBrand] = useState<Brand>(MUNTALK_BRAND);
  useEffect(() => {
    setBrand(brandForHost(window.location.hostname));
  }, []);
  return brand;
}
