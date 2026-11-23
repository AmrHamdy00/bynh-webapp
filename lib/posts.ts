import 'server-only';
/**
 * Read side of the blog for the public site. Results are cached (Next data cache, tag "posts") and invalidated by
 * the admin on publish/update (revalidateTag('posts')), so pages stay as fast as static HTML.
 * Scheduled posts go live on their own: list queries refresh every 5 minutes.
 */
import { unstable_cache } from 'next/cache';
import { and, eq, inArray, lte, sql, desc } from 'drizzle-orm';
import { db, schema as s } from './db';
import type { Seo } from './db/schema';

export const PER_PAGE = 9;
export const POSTS_TAG = 'posts';

export type PostLite = {
  id: number; slug: string; date: string; modified: string; title: string; excerpt: string;
  image: string | null; imageSmall: string | null; tags: string[];
};
export type Post = PostLite & {
  content: string; seo: Seo; schema: unknown; authorName: string; readingMinutes: number | null;
  publishedAt: string; modifiedAt: string; categories: string[];
  cover: { path: string; width: number | null; height: number | null; mime: string } | null;
};

const live = () => and(inArray(s.posts.status, ['published', 'scheduled']), lte(s.posts.publishedAt, sql`now()`));
const pick = (m: { path: string; sizes: Record<string, { path: string }> } | null, ...keys: string[]) => {
  if (!m) return null;
  for (const k of keys) if (m.sizes?.[k]?.path) return m.sizes[k].path;
  return m.path;
};
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

async function tagMap(ids: number[]) {
  const rows = ids.length
    ? await db.select({ postId: s.postTags.postId, name: s.tags.name }).from(s.postTags).innerJoin(s.tags, eq(s.tags.id, s.postTags.tagId)).where(inArray(s.postTags.postId, ids))
    : [];
  const m = new Map<number, string[]>();
  for (const r of rows) m.set(r.postId, [...(m.get(r.postId) || []), r.name]);
  return m;
}

/** All live posts, newest first, without bodies. */
export const getAllPosts = unstable_cache(async (): Promise<PostLite[]> => {
  const rows = await db.select({
    id: s.posts.id, slug: s.posts.slug, title: s.posts.title, excerpt: s.posts.excerpt, publishedAt: s.posts.publishedAt, modifiedAt: s.posts.modifiedAt,
    mPath: s.media.path, mSizes: s.media.sizes,
  }).from(s.posts).leftJoin(s.media, eq(s.media.id, s.posts.coverMediaId)).where(live()).orderBy(desc(s.posts.publishedAt), desc(s.posts.id));
  const tags = await tagMap(rows.map((r) => r.id));
  return rows.map((r) => {
    const m = r.mPath ? { path: r.mPath, sizes: r.mSizes || {} } : null;
    return {
      id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt.slice(0, 240), date: day(r.publishedAt), modified: day(r.modifiedAt),
      image: pick(m, 'large', 'medium_large', 'full'), imageSmall: pick(m, 'medium_large', 'medium', 'large'), tags: tags.get(r.id) || [],
    };
  });
}, ['all-posts'], { tags: [POSTS_TAG], revalidate: 300 });

/** One live post by its (decoded) slug. */
export const getPost = unstable_cache(async (slug: string): Promise<Post | null> => {
  const [r] = await db.select({ p: s.posts, m: s.media }).from(s.posts).leftJoin(s.media, eq(s.media.id, s.posts.coverMediaId))
    .where(and(eq(s.posts.slug, slug), live())).limit(1);
  if (!r) return null;
  const { p, m } = r;
  const tags = (await tagMap([p.id])).get(p.id) || [];
  const cats = await db.select({ name: s.categories.name }).from(s.postCategories).innerJoin(s.categories, eq(s.categories.id, s.postCategories.categoryId)).where(eq(s.postCategories.postId, p.id));
  return {
    id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, seo: p.seo, schema: p.schema, authorName: p.authorName,
    readingMinutes: p.readingMinutes, date: day(p.publishedAt), modified: day(p.modifiedAt),
    publishedAt: p.publishedAt!.toISOString(), modifiedAt: p.modifiedAt.toISOString(), tags, categories: cats.map((c) => c.name),
    image: pick(m, 'large', 'medium_large', 'full'), imageSmall: pick(m, 'medium_large', 'medium', 'large'),
    cover: m ? { path: m.path, width: m.width, height: m.height, mime: m.mime } : null,
  };
}, ['post'], { tags: [POSTS_TAG], revalidate: 300 });

/** Tags with live post counts. */
export const getTags = unstable_cache(async () => {
  return db.select({ name: s.tags.name, slug: s.tags.slug, count: sql<number>`count(*)::int` }).from(s.tags)
    .innerJoin(s.postTags, eq(s.postTags.tagId, s.tags.id)).innerJoin(s.posts, eq(s.posts.id, s.postTags.postId))
    .where(live()).groupBy(s.tags.id).orderBy(desc(sql`count(*)`));
}, ['tags'], { tags: [POSTS_TAG], revalidate: 300 });
