import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import type { PostInput } from './PostForm';

/** datetime-local value in Riyadh time */
export const toLocalInput = (d: Date | null) => (d ? new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 16) : '');

export async function taxonomies() {
  const [tags, categories] = await Promise.all([
    db.select({ id: s.tags.id, name: s.tags.name }).from(s.tags).orderBy(asc(s.tags.name)),
    db.select({ id: s.categories.id, name: s.categories.name }).from(s.categories).orderBy(asc(s.categories.name)),
  ]);
  return { tags, categories };
}

export async function loadPost(id: number): Promise<(PostInput & { authorId: number | null }) | null> {
  const [r] = await db.select({ p: s.posts, m: s.media }).from(s.posts).leftJoin(s.media, eq(s.media.id, s.posts.coverMediaId)).where(eq(s.posts.id, id));
  if (!r) return null;
  const [t, c] = await Promise.all([
    db.select({ id: s.postTags.tagId }).from(s.postTags).where(eq(s.postTags.postId, id)),
    db.select({ id: s.postCategories.categoryId }).from(s.postCategories).where(eq(s.postCategories.postId, id)),
  ]);
  const { p, m } = r;
  return {
    id: p.id, title: p.title, slug: p.slug, status: p.status, excerpt: p.excerpt, content: p.content, publishedAt: toLocalInput(p.publishedAt),
    cover: m ? { id: m.id, path: m.sizes?.medium_large?.path || m.sizes?.large?.path || m.path } : null,
    tagIds: t.map((x) => x.id), categoryIds: c.map((x) => x.id), seo: p.seo, authorId: p.authorId,
  };
}
