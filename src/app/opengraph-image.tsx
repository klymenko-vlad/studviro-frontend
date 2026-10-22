import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

/**
 * The card a shared link renders as. `twitter.card` is `summary_large_image`,
 * which without this falls back to whatever the crawler can scrape — usually
 * nothing.
 *
 * Deliberately typographic: a font file or a remote asset would have to be
 * fetched during the render of every crawl.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const [common, home] = await Promise.all([
    getTranslations('common'),
    getTranslations('home'),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0b0b0f',
        color: '#fafafa',
        padding: 80,
      }}
    >
      <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
        {common('appName')}
      </div>
      <div style={{ fontSize: 60, lineHeight: 1.15, letterSpacing: -2, maxWidth: 960 }}>
        {home('title')}
      </div>
      <div style={{ fontSize: 28, color: '#a1a1aa' }}>{common('appDescription')}</div>
    </div>,
    size,
  );
}
