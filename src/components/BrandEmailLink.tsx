'use client';

import { useBrand } from '@/lib/useBrand';

// Host-scoped contact email for server-rendered pages (e.g. /ko) that can't
// call the useBrand hook directly: muntuz.com shows muntuz.official@gmail.com,
// every other host keeps muntalkofficial@gmail.com. Same pattern as the
// legal pages in QA batch 4 (#212).
export default function BrandEmailLink({ style }: { style?: React.CSSProperties }) {
  const brand = useBrand();
  return (
    <a href={`mailto:${brand.email}`} style={style}>
      {brand.email}
    </a>
  );
}
