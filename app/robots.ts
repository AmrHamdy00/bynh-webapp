import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content';

/** STAGING=1 (e.g. the Vercel test copy): block every crawler so the copy never competes with bynh.sa in Google. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.STAGING === '1') return { rules: [{ userAgent: '*', disallow: '/' }] };
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/wp-admin/', '/api/'] }], sitemap: `${SITE_URL}/sitemap_index.xml` };
}
