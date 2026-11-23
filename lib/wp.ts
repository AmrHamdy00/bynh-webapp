/**
 * WordPress (headless) data layer — runs at BUILD time only.
 * The static export turns every post into /<arabic-slug>/index.html, so new posts appear after a rebuild
 * (see README: WordPress publish hook → rebuild → rsync to nginx).
 *
 * WP_API_URL       REST base. Today https://bynh.sa/wp-json/wp/v2 ; after the switch https://cms.bynh.sa/wp-json/wp/v2
 * WP_MEDIA_ORIGIN  Origin that serves /wp-content/ images. Leave empty in production (nginx proxies /wp-content/
 *                  to the CMS, so relative URLs work); set to https://cms.bynh.sa for local previews.
 * SITE_URL         Public origin used for canonical / Open Graph URLs (https://bynh.sa).
 */
export const WP_API = process.env.WP_API_URL || 'https://bynh.sa/wp-json/wp/v2';
export const SITE_URL = (process.env.SITE_URL || 'https://bynh.sa').replace(/\/$/, '');
const MEDIA = (process.env.WP_MEDIA_ORIGIN ?? 'https://bynh.sa').replace(/\/$/, '');
const WP_HOSTS = /https?:\/\/(?:www\.)?(?:cms\.)?bynh\.sa/g;

export type Post = {
  id: number;
  slug: string;          // decoded Arabic slug, e.g. نظام-المعاملات-التجارية-الجديد-2026
  date: string;          // YYYY-MM-DD
  title: string;
  excerpt: string;
  content: string;       // WordPress HTML as authored (links made site-relative, media pointed at MEDIA)
  image: string | null;
  imageSmall: string | null;
  tags: string[];
  seo: Yoast;
};
export type Yoast = { title?: string; description?: string; og_image?: { url: string }[]; canonical?: string; og_title?: string; og_description?: string };
export type Tag = { id: number; name: string; count: number };

const strip = (h: string) =>
  h.replace(/<[^>]+>/g, '').replace(/&#8230;|\[&hellip;\]|&hellip;/g, '…').replace(/&nbsp;/g, ' ')
   .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();

/** Links to bynh.sa pages/posts become site-relative; /wp-content/ media goes to MEDIA. */
export function localize(html: string): string {
  return html
    .replace(/(src|srcset|href)=("|')([^"']*)\2/g, (_m, attr, q, val: string) => {
      const v = val.replace(WP_HOSTS, (h) => h);
      const out = v.replace(WP_HOSTS, '').replace(/(^|,\s*)(\/wp-content\/)/g, `$1${MEDIA}$2`);
      return `${attr}=${q}${out || '/'}${q}`;
    })
    .replace(/<script[\s\S]*?<\/script>/g, '');
}

async function get(path: string): Promise<{ data: any; total: number; pages: number }> {
  const res = await fetch(`${WP_API}${path}`, { headers: { Accept: 'application/json' }, cache: 'force-cache' });
  if (!res.ok) throw new Error(`WordPress API ${res.status} for ${path}`);
  return { data: await res.json(), total: +(res.headers.get('x-wp-total') || 0), pages: +(res.headers.get('x-wp-totalpages') || 1) };
}

let tagsCache: Promise<Tag[]> | null = null;
export function getTags(): Promise<Tag[]> {
  return (tagsCache ??= get('/tags?per_page=100&_fields=id,name,count').then((r) => (r.data as Tag[]).filter((t) => t.count > 0)));
}

let postsCache: Promise<Post[]> | null = null;
/** All published posts, newest first (WordPress default order). */
export function getAllPosts(): Promise<Post[]> {
  return (postsCache ??= (async () => {
    const tags = new Map((await getTags()).map((t) => [t.id, t.name]));
    const fields = '_fields=id,slug,date,title,excerpt,content,tags,yoast_head_json,_links,_embedded&_embed=wp:featuredmedia';
    const first = await get(`/posts?per_page=100&page=1&${fields}`);
    const rest = await Promise.all(Array.from({ length: Math.max(0, first.pages - 1) }, (_, i) => get(`/posts?per_page=100&page=${i + 2}&${fields}`)));
    const raw: any[] = [first, ...rest].flatMap((r) => r.data);
    return raw.map((p): Post => {
      const media = p._embedded?.['wp:featuredmedia']?.[0];
      const sizes = media?.media_details?.sizes || {};
      const pick = (...k: string[]) => { for (const s of k) if (sizes[s]?.source_url) return sizes[s].source_url as string; return media?.source_url || null; };
      const fix = (u: string | null) => (u ? u.replace(WP_HOSTS, '').replace(/^\/wp-content\//, `${MEDIA}/wp-content/`) : null);
      return {
        id: p.id,
        slug: decodeURIComponent(p.slug),
        date: String(p.date).slice(0, 10),
        title: strip(p.title?.rendered || ''),
        excerpt: strip(p.excerpt?.rendered || '').slice(0, 240),
        content: localize(p.content?.rendered || ''),
        image: fix(pick('large', 'medium_large', 'full')),
        imageSmall: fix(pick('medium_large', 'medium', 'large')),
        tags: (p.tags || []).map((id: number) => tags.get(id)).filter(Boolean) as string[],
        seo: p.yoast_head_json || {},
      };
    });
  })());
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return (await getAllPosts()).find((p) => p.slug === slug);
}

export const PER_PAGE = 9;

/** Adds ids to <h2> headings and returns the table of contents. */
export function withToc(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_m, attrs: string, inner: string) => {
    const text = strip(inner);
    if (!text) return _m;
    const id = `s${toc.length + 1}`;
    toc.push({ id, text });
    return `<h2${attrs.replace(/\sid=("|')[^"']*\1/, '')} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** Canonical/OG URLs from Yoast point at whichever host WordPress runs on; force the public site. */
export const publicUrl = (u?: string) => (u ? u.replace(WP_HOSTS, SITE_URL) : undefined);
