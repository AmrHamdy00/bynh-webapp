/** Helpers shared by the importer, the public pages and the admin (no server-only imports here). */
import type { Seo } from './db/schema';

export const SITE_URL = (process.env.SITE_URL || 'https://bynh.sa').replace(/\/$/, '');
/** Hosts whose links inside content are made site-relative (the old WordPress, before and after the move). */
const OWN_HOSTS = /https?:\/\/(?:www\.)?(?:cms\.)?bynh\.sa(?=[/"'?#\s]|$)/g;

export const decodeEntities = (s: string) =>
  s.replace(/&#8230;|&hellip;/g, '…').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
   .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
   .replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
export const stripTags = (h: string) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Links to our own pages and media become site-relative; scripts are dropped. */
export function rewriteHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/(src|srcset|href)=("|')([^"']*)\2/g, (_m, attr, q, val: string) => `${attr}=${q}${val.replace(OWN_HOSTS, '') || '/'}${q}`);
}

/** Absolute public URL for a site path or an own-host URL. */
export const absUrl = (u?: string | null) => {
  if (!u) return undefined;
  if (u.startsWith('/')) return SITE_URL + u;
  return u.replace(OWN_HOSTS, SITE_URL);
};
/** Rewrites own-host URLs anywhere inside a JSON value (Yoast JSON-LD) to SITE_URL. */
export const absJson = <T,>(v: T): T => JSON.parse(JSON.stringify(v).replace(OWN_HOSTS, SITE_URL));

/** Yoast's yoast_head_json → our Seo record (paths kept relative where they point at our site). */
export function yoastToSeo(y: any): Seo {
  const rel = (u?: string) => (u ? u.replace(OWN_HOSTS, '') || '/' : undefined);
  const r = y.robots || {};
  const robots = [r.index, r.follow, r['max-snippet'], r['max-image-preview'], r['max-video-preview']].filter(Boolean).join(', ');
  const img = y.og_image?.[0];
  return {
    title: y.title || undefined,
    description: y.description || undefined,
    canonical: rel(y.canonical),
    robots: robots || undefined,
    ogTitle: y.og_title || undefined,
    ogDescription: y.og_description || undefined,
    ogImage: img ? { url: rel(img.url)!, width: img.width, height: img.height, type: img.type } : undefined,
    twitterTitle: y.twitter_title || undefined,
    twitterDescription: y.twitter_description || undefined,
    twitterImage: rel(y.twitter_image),
  };
}

export const DEFAULT_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

/** Estimated reading time in minutes (Arabic ~ 200 words/min, like Yoast). */
export const readingMinutes = (html: string) => Math.max(1, Math.round(stripTags(html).split(/\s+/).length / 200));

/** Adds ids to <h2> headings and returns the table of contents. */
export function withToc(html: string): { html: string; toc: { id: string; text: string }[] } {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs: string, inner: string) => {
    const text = decodeEntities(stripTags(inner));
    if (!text) return m;
    const id = `s${toc.length + 1}`;
    toc.push({ id, text });
    return `<h2${attrs.replace(/\sid=("|')[^"']*\1/, '')} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export const postPath = (slug: string) => `/${slug}/`;
export const encPath = (p: string) => p.split('/').map((s) => encodeURIComponent(s)).join('/');
