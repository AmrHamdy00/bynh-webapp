import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { SITE_URL } from '@/lib/content';

// Self-hosted at build time by next/font (no runtime call to Google).
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--plex' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: { icon: '/img/mark.png', apple: '/img/mark.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#083A51' };

/** Shared root: font, language and direction. The public site and the admin each add their own chrome. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
