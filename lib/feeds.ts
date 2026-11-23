import 'server-only';
import { unstable_cache } from 'next/cache';
import { and, desc, eq, inArray, lte, sql } from 'drizzle-orm';
import { db, schema as s } from './db';
import { POSTS_TAG } from './posts';
import { PAGES } from './seo';
import { SITE_URL, encPath, postPath } from './content';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
const abs = (p: string) => SITE_URL + encPath(p);
const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8', 'X-Robots-Tag': 'noindex, follow', 'Cache-Control': 'public, max-age=300' };

const livePosts = unstable_cache(async () => {
  const rows = await db.select({ slug: s.posts.slug, title: s.posts.title, excerpt: s.posts.excerpt, publishedAt: s.posts.publishedAt,
    images: sql<string[]>`array(select distinct m[1] from regexp_matches(${s.posts.content}, '<img[^>]+src="(/wp-content/[^"]+)"', 'g') as m)`,
    modifiedAt: s.posts.modifiedAt, authorName: s.posts.authorName, cover: s.media.path, id: s.posts.id })
    .from(s.posts).leftJoin(s.media, eq(s.media.id, s.posts.coverMediaId))
    .where(and(inArray(s.posts.status, ['published', 'scheduled']), lte(s.posts.publishedAt, sql`now()`)))
    .orderBy(desc(s.posts.publishedAt));
  const cats = await db.select({ postId: s.postCategories.postId, name: s.categories.name }).from(s.postCategories).innerJoin(s.categories, eq(s.categories.id, s.postCategories.categoryId));
  const byPost = new Map<number, string[]>();
  for (const c of cats) byPost.set(c.postId, [...(byPost.get(c.postId) || []), c.name]);
  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt!.toISOString(), modifiedAt: r.modifiedAt.toISOString(), categories: byPost.get(r.id) || [] }));
}, ['feed-posts'], { tags: [POSTS_TAG], revalidate: 300 });

const imagesIn = (images: string[], cover: string | null) => [...new Set([...(cover ? [cover] : []), ...images])];

const feedBodies = unstable_cache(async (slugs: string[]) => {
  const rows = await db.select({ slug: s.posts.slug, content: s.posts.content }).from(s.posts).where(inArray(s.posts.slug, slugs));
  return Object.fromEntries(rows.map((r) => [r.slug, r.content]));
}, ['feed-bodies'], { tags: [POSTS_TAG], revalidate: 300 });

export async function sitemapIndex() {
  const posts = await livePosts();
  const last = posts[0]?.modifiedAt ? posts.reduce((a, p) => (p.modifiedAt > a ? p.modifiedAt : a), posts[0].modifiedAt) : new Date().toISOString();
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<sitemap><loc>${SITE_URL}/post-sitemap.xml</loc><lastmod>${iso(new Date(last))}</lastmod></sitemap>
	<sitemap><loc>${SITE_URL}/page-sitemap.xml</loc></sitemap>
</sitemapindex>`, { headers: XML_HEADERS });
}

export async function postSitemap() {
  const posts = await livePosts();
  const urls = posts.map((p) => `	<url>
		<loc>${xml(abs(postPath(p.slug)))}</loc>
		<lastmod>${iso(new Date(p.modifiedAt))}</lastmod>
${imagesIn(p.images, p.cover).map((i) => `		<image:image><image:loc>${xml(abs(i))}</image:loc></image:image>`).join('\n')}
	</url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`, { headers: XML_HEADERS });
}

export async function pageSitemap() {
  const posts = await livePosts();
  const urls = Object.keys(PAGES).map((p) => `	<url><loc>${xml(abs(p))}</loc>${p === '/' || p === '/المدونة/' ? `<lastmod>${iso(new Date(posts[0]?.publishedAt || Date.now()))}</lastmod>` : ''}</url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`, { headers: XML_HEADERS });
}

/** RSS 2.0 at /feed/ — same channel and items WordPress published, so feed readers and aggregators keep working. */
export async function rssFeed() {
  const posts = (await livePosts()).slice(0, 10);
  const bodies = await feedBodies(posts.map((p) => p.slug));
  const rfc = (d: string) => new Date(d).toUTCString().replace('GMT', '+0000');
  const items = posts.map((p) => `	<item>
		<title>${xml(p.title)}</title>
		<link>${xml(abs(postPath(p.slug)))}</link>
		<dc:creator><![CDATA[${p.authorName}]]></dc:creator>
		<pubDate>${rfc(p.publishedAt)}</pubDate>
${p.categories.map((c) => `		<category><![CDATA[${c}]]></category>`).join('\n')}
		<guid isPermaLink="true">${xml(abs(postPath(p.slug)))}</guid>
		<description><![CDATA[${p.excerpt}]]></description>
		<content:encoded><![CDATA[${(bodies[p.slug] || '').replace(/(src|href)="\//g, `$1="${SITE_URL}/`).replace(/]]>/g, ']]&gt;')}]]></content:encoded>
	</item>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
	<title>بينه</title>
	<atom:link href="${SITE_URL}/feed/" rel="self" type="application/rss+xml" />
	<link>${SITE_URL}/</link>
	<description>استشارات قانونية موثوقة محامين مرخصين من وزارة العدل</description>
	<lastBuildDate>${posts[0] ? rfc(posts[0].modifiedAt) : rfc(new Date().toISOString())}</lastBuildDate>
	<language>ar</language>
${items}
</channel>
</rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
