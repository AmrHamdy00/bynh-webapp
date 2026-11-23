import type { MetadataRoute } from 'next';
import { getAllPosts, SITE_URL } from '@/lib/wp';
import { PAGES } from '@/lib/seo';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return [
    ...Object.keys(PAGES).map((p) => ({ url: `${SITE_URL}${encodeURI(p)}`, changeFrequency: 'monthly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...posts.map((p) => ({ url: `${SITE_URL}/${encodeURI(p.slug)}/`, lastModified: p.date, changeFrequency: 'yearly' as const, priority: 0.6 })),
  ];
}
