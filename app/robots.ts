import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/wp-admin/', '/api/'] }], sitemap: `${SITE_URL}/sitemap_index.xml` };
}
