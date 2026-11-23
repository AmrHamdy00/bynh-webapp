/**
 * One-time (re-runnable) import from WordPress into PostgreSQL, through the public REST API.
 *
 *   npx tsx scripts/import-wp.ts                 # posts, tags, categories, media records + download files
 *   npx tsx scripts/import-wp.ts --no-download   # records only
 *
 * Keeps everything search engines see: same slugs, same WordPress ids, published/modified dates, the full Yoast
 * SEO data (title, description, canonical, robots, Open Graph, Twitter, JSON-LD graph), and every uploaded file
 * at its identical path (/wp-content/uploads/YYYY/MM/name.ext) under UPLOAD_DIR.
 * Env: DATABASE_URL, WP_API_URL (default https://bynh.sa/wp-json/wp/v2), UPLOAD_DIR (default ./storage/uploads).
 * In the cloud container run with NODE_USE_ENV_PROXY=1.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import * as s from '../lib/db/schema';
import { dbUrl, isPooled } from '../lib/db/url';
import { rewriteHtml, yoastToSeo, decodeEntities, stripTags } from '../lib/content';

const API = (process.env.WP_API_URL || 'https://bynh.sa/wp-json/wp/v2').replace(/\/$/, '');
const ORIGIN = new URL(API).origin;
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'storage/uploads');
const DOWNLOAD = !process.argv.includes('--no-download');
// direct (unpooled) connection when available, e.g. Neon on Vercel
const client = postgres(dbUrl(true), { max: 4, prepare: !isPooled(dbUrl(true)) });
const db = drizzle(client, { schema: s });

async function api(path: string) {
  for (let i = 0; ; i++) {
    const r = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } });
    if (r.ok) return { data: (await r.json()) as any[], pages: +(r.headers.get('x-wp-totalpages') || 1) };
    if (i >= 3) throw new Error(`${r.status} ${path}`);
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
}
async function all(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  const first = await api(`${path}${sep}per_page=100&page=1`);
  const out = [...first.data];
  for (let p = 2; p <= first.pages; p++) out.push(...(await api(`${path}${sep}per_page=100&page=${p}`)).data);
  return out;
}
const dslug = (x: string) => { try { return decodeURIComponent(x); } catch { return x; } };
const uploadPath = (url: string) => { const m = /\/wp-content\/uploads\/[^?#"' ]+/.exec(url); return m ? dslug(m[0]) : null; };

async function main() {
  console.log(`importing from ${API}`);

  /* taxonomy */
  const tags = await all('/tags?_fields=id,slug,name,description');
  for (const t of tags) await db.insert(s.tags).values({ id: t.id, slug: dslug(t.slug), name: decodeEntities(t.name), description: t.description || '' })
    .onConflictDoUpdate({ target: s.tags.id, set: { slug: dslug(t.slug), name: decodeEntities(t.name), description: t.description || '' } });
  const cats = await all('/categories?_fields=id,slug,name,description');
  for (const c of cats) await db.insert(s.categories).values({ id: c.id, slug: dslug(c.slug), name: decodeEntities(c.name), description: c.description || '' })
    .onConflictDoUpdate({ target: s.categories.id, set: { slug: dslug(c.slug), name: decodeEntities(c.name), description: c.description || '' } });
  console.log(`tags ${tags.length}, categories ${cats.length}`);

  /* media library */
  const mediaRaw = await all('/media?_fields=id,date_gmt,source_url,mime_type,media_details,alt_text,title');
  const files = new Set<string>();
  for (const m of mediaRaw) {
    const path = uploadPath(m.source_url);
    if (!path) continue;
    files.add(path);
    const sizes: Record<string, s.MediaSize> = {};
    for (const [k, v] of Object.entries<any>(m.media_details?.sizes || {})) {
      const p = uploadPath(v.source_url); if (!p) continue;
      sizes[k] = { path: p, width: v.width, height: v.height }; files.add(p);
    }
    const row = { id: m.id, wpId: m.id, path, mime: m.mime_type, width: m.media_details?.width ?? null, height: m.media_details?.height ?? null,
      bytes: m.media_details?.filesize ?? null, alt: m.alt_text || '', title: decodeEntities(m.title?.rendered || ''), sizes,
      createdAt: new Date(m.date_gmt + 'Z') };
    await db.insert(s.media).values(row).onConflictDoUpdate({ target: s.media.id, set: row });
  }
  console.log(`media records ${mediaRaw.length}`);

  /* posts */
  const fields = 'id,slug,status,date_gmt,modified_gmt,title,excerpt,content,featured_media,tags,categories,yoast_head_json';
  const posts = await all(`/posts?_fields=${fields}`);
  const mediaIds = new Set(mediaRaw.map((m) => m.id));
  for (const p of posts) {
    const content = rewriteHtml(p.content?.rendered || '');
    for (const m of content.matchAll(/\/wp-content\/uploads\/[^"'\s,)]+/g)) files.add(dslug(m[0]));
    const y = p.yoast_head_json || {};
    const row = {
      id: p.id, wpId: p.id, slug: dslug(p.slug), status: 'published' as const,
      title: decodeEntities(stripTags(p.title?.rendered || '')),
      excerpt: decodeEntities(stripTags(p.excerpt?.rendered || '')).replace(/\s*\[…\]$|\s*\[&hellip;\]$/, '').trim(),
      content, coverMediaId: mediaIds.has(p.featured_media) ? p.featured_media : null,
      authorName: y.author || 'فريق بينه',
      seo: yoastToSeo(y), schema: y.schema ?? null,
      readingMinutes: parseInt(y.twitter_misc?.['وقت القراءة المُقدّر'] || '', 10) || null,
      publishedAt: new Date(p.date_gmt + 'Z'), modifiedAt: new Date(p.modified_gmt + 'Z'),
      createdAt: new Date(p.date_gmt + 'Z'),
    };
    await db.insert(s.posts).values(row).onConflictDoUpdate({ target: s.posts.id, set: row });
    await db.delete(s.postTags).where(sql`${s.postTags.postId} = ${p.id}`);
    await db.delete(s.postCategories).where(sql`${s.postCategories.postId} = ${p.id}`);
    if (p.tags?.length) await db.insert(s.postTags).values(p.tags.map((t: number) => ({ postId: p.id, tagId: t }))).onConflictDoNothing();
    if (p.categories?.length) await db.insert(s.postCategories).values(p.categories.map((c: number) => ({ postId: p.id, categoryId: c }))).onConflictDoNothing();
  }
  console.log(`posts ${posts.length}`);
  /* SEO of the WordPress pages that now live as coded Next.js pages (same paths) */
  const pages = await all('/pages?_fields=id,link,title,date_gmt,modified_gmt,yoast_head_json');
  for (const pg of pages) {
    const path = dslug(new URL(pg.link).pathname);
    const y = pg.yoast_head_json || {};
    const row = { path, name: decodeEntities(pg.title?.rendered || path), seo: yoastToSeo(y), ogType: y.og_type || 'article', schema: y.schema ?? null,
      publishedAt: new Date(pg.date_gmt + 'Z'), modifiedAt: new Date(pg.modified_gmt + 'Z'), wpId: pg.id };
    await db.insert(s.pageSeo).values(row).onConflictDoUpdate({ target: s.pageSeo.path, set: row });
  }
  console.log(`pages (SEO) ${pages.length}`);

  /* WordPress pages that were dropped in the new site, and other known legacy URLs */
  const legacy: [string, string, string][] = [
    ['/training/', '/', 'old empty page'], ['/landing/', '/', 'old copy of the home page'], ['/soon/', '/', 'old placeholder'],
    ['/my-account/', '/', 'old WooCommerce page'], ['/checkout/', '/', 'old WooCommerce page'],
    ['/بينه-محامين-مرخصين/', '/', 'old WordPress home page slug'], ['/افضل-محامي-في-الرياض/', '/المدونة/', 'deleted post still linked from articles'],
  ];
  for (const [fromPath, toPath, note] of legacy) await db.insert(s.redirects).values({ fromPath, toPath, code: 301, note }).onConflictDoNothing();

  // keep serial sequences ahead of imported ids
  for (const t of ['posts', 'media', 'tags', 'categories'])
    await client.unsafe(`select setval(pg_get_serial_sequence('${t}','id'), greatest((select max(id) from ${t}), 1))`);

  /* files */
  if (DOWNLOAD) {
    const list = [...files];
    let ok = 0, skipped = 0, failed: string[] = [];
    const queue = [...list];
    await Promise.all(Array.from({ length: 8 }, async () => {
      for (let p; (p = queue.shift());) {
        const dest = join(UPLOAD_DIR, p.replace(/^\/wp-content\/uploads\//, ''));
        if (!dest.startsWith(UPLOAD_DIR)) { failed.push(p); continue; }
        try { await stat(dest); skipped++; continue; } catch {}
        try {
          const r = await fetch(ORIGIN + encodeURI(p));
          if (!r.ok) { failed.push(`${r.status} ${p}`); continue; }
          await mkdir(dirname(dest), { recursive: true });
          await writeFile(dest, Buffer.from(await r.arrayBuffer()));
          if (++ok % 250 === 0) console.log(`  files ${ok}/${list.length}`);
        } catch (e) { failed.push(`${String(e)} ${p}`); }
      }
    }));
    console.log(`files: ${ok} downloaded, ${skipped} already present, ${failed.length} failed`);
    if (failed.length) await writeFile(join(process.cwd(), 'storage/import-failed.txt'), failed.join('\n'));
  }
  await client.end();
}

main().catch(async (e) => { console.error(e); await client.end(); process.exit(1); });
