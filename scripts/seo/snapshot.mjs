#!/usr/bin/env node
/**
 * SEO snapshot of a site: for every URL, record status, redirect target and everything search engines read
 * (title, meta description, robots, canonical, Open Graph, Twitter, article times, JSON-LD, h1).
 *
 *   node scripts/seo/snapshot.mjs --base https://bynh.sa --out seo/baseline.json            # old WordPress site
 *   node scripts/seo/snapshot.mjs --base http://localhost:3000 --urls seo/baseline.json --out seo/local.json
 *
 * Without --urls the URL list is discovered from the site's Yoast sitemaps plus the archive URLs WordPress serves
 * (tags, categories, author, blog pagination, feed). With --urls the same paths are fetched from --base, so the two
 * snapshots can be compared with scripts/seo/compare.mjs.
 * In the cloud container run with NODE_USE_ENV_PROXY=1.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'https://bynh.sa').replace(/\/$/, '');
const OUT = arg('out', 'seo/baseline.json');
const URLS = arg('urls');
const CONC = +arg('concurrency', 8);
const UA = 'Mozilla/5.0 (compatible; bynh-seo-snapshot/1.0)';

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
/** Path in a stable form: percent-decoded Arabic, trailing slash kept, query kept. */
export const normPath = (u) => { const x = new URL(u, BASE); let p = x.pathname; try { p = decodeURIComponent(p); } catch {} return p + x.search; };

async function get(url, redirect = 'manual') {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { redirect, headers: { 'User-Agent': UA, Accept: 'text/html,application/xml,*/*' } });
      if (r.status >= 500 && i < 2) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
      return { status: r.status, location: r.headers.get('location'), type: r.headers.get('content-type') || '', body: r.status < 300 ? await r.text() : '' };
    } catch (e) { if (i === 2) return { status: 0, error: String(e), body: '' }; await new Promise((s) => setTimeout(s, 1000 * (i + 1))); }
  }
}

async function discover() {
  const locs = async (u) => [...(await get(u, 'follow')).body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => decode(m[1]));
  const sitemaps = await locs(`${BASE}/sitemap_index.xml`);
  const urls = new Set();
  for (const s of sitemaps) for (const u of await locs(s)) urls.add(u);
  const api = async (p) => (await (await fetch(`${BASE}/wp-json/wp/v2/${p}`, { headers: { 'User-Agent': UA } })).json());
  for (const t of await api('tags?per_page=100&_fields=link,count')) { urls.add(t.link); if (t.count > 10) urls.add(`${t.link}page/2/`); }
  for (const c of await api('categories?per_page=100&_fields=link,count')) { urls.add(c.link); if (c.count > 10) urls.add(`${c.link}page/2/`); }
  for (const a of await api('users?_fields=link')) { urls.add(a.link); urls.add(`${a.link}page/2/`); }
  const blog = `${BASE}/${encodeURIComponent('المدونة')}/`;
  for (let n = 2; n <= 6; n++) urls.add(`${blog}page/${n}/`);
  for (const p of ['/feed/', '/comments/feed/', '/sitemap_index.xml', '/post-sitemap.xml', '/page-sitemap.xml', '/robots.txt', '/wp-admin/', '/wp-login.php', '/?s=محامي'])
    urls.add(`${BASE}${p}`);
  return [...urls].map(normPath);
}

const metaAll = (html) => {
  const m = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const k = /\b(?:name|property)=["']([^"']+)["']/i.exec(tag)?.[1];
    const v = /\bcontent=["']([^"']*)["']/i.exec(tag)?.[1];
    if (!k || v == null) continue;
    const key = k.toLowerCase();
    if (!/^(description|robots|googlebot|og:|twitter:|article:)/.test(key)) continue;
    m[key] = m[key] ? [].concat(m[key], decode(v)) : decode(v);
  }
  return m;
};

function extract(html) {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || 200000);
  const ld = [];
  for (const [, j] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) { try { ld.push(JSON.parse(j)); } catch { ld.push({ invalid: true }); } }
  const types = new Set();
  const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === 'object') { if (o['@type']) [].concat(o['@type']).forEach((t) => types.add(t)); Object.values(o).forEach(walk); } };
  walk(ld);
  return {
    title: decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1]?.trim() || ''),
    canonical: (() => { const h = /<link[^>]*rel=["']canonical["'][^>]*>/i.exec(head)?.[0]; return h ? decode(/href=["']([^"']+)/.exec(h)?.[1] || '') : null; })(),
    meta: metaAll(head),
    h1: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())),
    ldTypes: [...types].sort(),
    lang: /<html[^>]*\blang=["']([^"']+)/i.exec(html)?.[1] || null,
    dir: /<html[^>]*\bdir=["']([^"']+)/i.exec(html)?.[1] || null,
    images: (html.match(/<img\b/gi) || []).length,
    words: html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length,
  };
}

const paths = URLS ? Object.keys(JSON.parse(await readFile(URLS, 'utf8')).pages) : await discover();
console.error(`${paths.length} URLs from ${BASE}`);
const pages = {};
let done = 0;
const queue = [...paths];
await Promise.all(Array.from({ length: CONC }, async () => {
  for (let p; (p = queue.shift()) !== undefined;) {
    const url = BASE + p.split('/').map((s, i) => (i === 0 ? s : encodeURIComponent(decodeURIComponent(s)))).join('/').replace(/%3F/g, '?').replace(/%3D/g, '=').replace(/%26/g, '&');
    const r = await get(url);
    const rec = { status: r.status };
    if (r.location) rec.location = normPath(new URL(r.location, url).href);
    if (r.error) rec.error = r.error;
    if (r.type.includes('html') && r.body) Object.assign(rec, extract(r.body));
    else if (r.body) rec.type = r.type.split(';')[0];
    pages[p] = rec;
    if (++done % 50 === 0) console.error(`  ${done}/${paths.length}`);
  }
}));
const sorted = Object.fromEntries(Object.keys(pages).sort().map((k) => [k, pages[k]]));
await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ base: BASE, takenAt: new Date().toISOString(), pages: sorted }, null, 1));
console.error(`wrote ${OUT}`);
