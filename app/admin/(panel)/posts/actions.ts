'use server';
/**
 * Post create/update/trash. Every write: role check → validation → sanitizing → revision → cache refresh of the
 * public pages. Changing the address of a published post adds a 301 from the old one automatically (keeps rankings).
 */
import { revalidatePath, revalidateTag } from 'next/cache';
import { and, eq, ne, inArray } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit, can } from '@/lib/auth/session';
import { sanitizePostHtml, cleanText, slugify } from '@/lib/sanitize';
import { readingMinutes } from '@/lib/content';
import { POSTS_TAG } from '@/lib/posts';
import { invalidateRedirects } from '@/lib/redirects';
import type { Seo } from '@/lib/db/schema';
import type { FormState } from '../../auth-actions';

const RESERVED = new Set(['admin', 'api', 'wp-content', 'feed', 'tag', 'category', 'author', 'المدونة', 'about-us', 'contact-us', 'privacy-policy',
  'terms-and-conditions', 'service-provider-agreement', 'استشارات-قانونية', 'خدمات-قانونية', 'طلب-تسجيل-محامي', 'الأسئلة-الشائعة', 'التسجيل', 'img', '_next', 'preview-draft']);

function refreshPublic(...slugs: string[]) {
  revalidateTag(POSTS_TAG);
  revalidatePath('/');
  revalidatePath('/المدونة/', 'layout');
  for (const sl of slugs) if (sl) revalidatePath(`/${sl}/`);
}

export async function savePostAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('author');
  const id = Number(form.get('id')) || null;
  const title = cleanText(form.get('title'), 200);
  if (!title) return { error: 'العنوان مطلوب.' };
  const slug = slugify(cleanText(form.get('slug'), 200) || title);
  if (!slug || RESERVED.has(slug)) return { error: 'الرابط غير صالح أو محجوز.' };
  let status = String(form.get('status')) as 'draft' | 'published' | 'scheduled';
  if (!['draft', 'published', 'scheduled'].includes(status)) status = 'draft';
  if (status !== 'draft' && !can(me, 'editor')) return { error: 'النشر متاح للمحرر أو المدير. احفظ كمسودة للمراجعة.' };
  const when = String(form.get('publishedAt') || '');
  let publishedAt: Date | null = when ? new Date(when + (when.length <= 16 ? ':00+03:00' : '')) : null; // input is Riyadh time
  if (publishedAt && isNaN(+publishedAt)) return { error: 'تاريخ النشر غير صالح.' };
  if (status === 'scheduled' && (!publishedAt || publishedAt <= new Date())) return { error: 'اختر وقتاً مستقبلياً للجدولة.' };

  const rawContent = String(form.get('content') || '').slice(0, 2_000_000);
  const excerpt = cleanText(form.get('excerpt'), 600);
  const seo: Seo = {
    title: cleanText(form.get('seoTitle'), 200) || undefined,
    description: cleanText(form.get('seoDescription'), 400) || undefined,
    canonical: cleanText(form.get('seoCanonical'), 500) || undefined,
    robots: form.get('noindex') ? 'noindex, follow' : undefined,
    ogTitle: cleanText(form.get('ogTitle'), 200) || undefined,
    ogDescription: cleanText(form.get('ogDescription'), 400) || undefined,
    focusKeyword: cleanText(form.get('focusKeyword'), 100) || undefined,
  };
  if (seo.canonical && !/^(\/|https:\/\/)/.test(seo.canonical)) return { error: 'الرابط القانوني يجب أن يبدأ بـ / أو https://' };
  const coverMediaId = Number(form.get('coverMediaId')) || null;
  const tagIds = form.getAll('tags').map(Number).filter(Boolean);
  const categoryIds = form.getAll('categories').map(Number).filter(Boolean);
  const newTag = cleanText(form.get('newTag'), 60);

  const [clash] = await db.select({ id: s.posts.id }).from(s.posts).where(id ? and(eq(s.posts.slug, slug), ne(s.posts.id, id)) : eq(s.posts.slug, slug));
  if (clash) return { error: 'يوجد مقال آخر بنفس الرابط.' };

  let old: typeof s.posts.$inferSelect | undefined;
  if (id) {
    [old] = await db.select().from(s.posts).where(eq(s.posts.id, id));
    if (!old) return { error: 'المقال غير موجود.' };
    if (!can(me, 'editor') && (old.authorId !== me.id || old.status !== 'draft')) return { error: 'لا تملك صلاحية تعديل هذا المقال.' };
  }

  // body not edited → keep the stored HTML byte-for-byte; anything edited is sanitized
  const content = old && rawContent === old.content ? old.content : sanitizePostHtml(rawContent);

  // publishing keeps the original date of an existing post (changing it would look like new content to Google)
  if (status === 'published') {
    const now = new Date();
    publishedAt = publishedAt && publishedAt <= now ? publishedAt : old?.publishedAt && old.publishedAt <= now ? old.publishedAt : now;
  }

  const values = {
    title, slug, status, content, excerpt, seo, coverMediaId, publishedAt: status === 'draft' ? old?.publishedAt ?? null : publishedAt,
    readingMinutes: readingMinutes(content), modifiedAt: new Date(),
    // once edited, the JSON-LD is generated from the current data instead of the imported Yoast copy
    schema: old && old.content === content && old.title === title && old.slug === slug ? old.schema : null,
  };

  const postId = await db.transaction(async (tx) => {
    let pid = id;
    if (pid) await tx.update(s.posts).set(values).where(eq(s.posts.id, pid));
    else pid = (await tx.insert(s.posts).values({ ...values, authorId: me.id, authorName: 'فريق بينه' }).returning({ id: s.posts.id }))[0].id;
    if (newTag) {
      const tslug = slugify(newTag);
      const [t] = await tx.insert(s.tags).values({ slug: tslug, name: newTag }).onConflictDoUpdate({ target: s.tags.slug, set: { name: newTag } }).returning({ id: s.tags.id });
      tagIds.push(t.id);
    }
    await tx.delete(s.postTags).where(eq(s.postTags.postId, pid));
    if (tagIds.length) await tx.insert(s.postTags).values([...new Set(tagIds)].map((tagId) => ({ postId: pid!, tagId }))).onConflictDoNothing();
    await tx.delete(s.postCategories).where(eq(s.postCategories.postId, pid));
    if (categoryIds.length) await tx.insert(s.postCategories).values([...new Set(categoryIds)].map((categoryId) => ({ postId: pid!, categoryId }))).onConflictDoNothing();
    await tx.insert(s.postRevisions).values({ postId: pid, title, content, excerpt, seo, userId: me.id });
    // address changed on a live post → permanent redirect from the old address (and re-point older redirects)
    if (old && old.slug !== slug && old.status !== 'draft') {
      const from = `/${old.slug}/`, to = `/${slug}/`;
      await tx.insert(s.redirects).values({ fromPath: from, toPath: to, code: 301, note: 'تغيير رابط مقال' })
        .onConflictDoUpdate({ target: s.redirects.fromPath, set: { toPath: to, code: 301 } });
      await tx.update(s.redirects).set({ toPath: to }).where(eq(s.redirects.toPath, from));
      await tx.delete(s.redirects).where(eq(s.redirects.fromPath, to)); // the new address must not redirect away
    }
    return pid!;
  });

  await audit(me.id, id ? 'post.update' : 'post.create', { entity: 'post', entityId: postId, data: { status, slug } });
  invalidateRedirects();
  refreshPublic(slug, old?.slug ?? '');
  revalidatePath('/admin/posts/');
  return { ok: status === 'published' ? 'تم الحفظ والنشر.' : status === 'scheduled' ? 'تمت الجدولة.' : 'تم حفظ المسودة.', go: id ? undefined : `/admin/posts/${postId}/` };
}

/** Moves posts to trash. A live post's address then 301s to the blog so its links and rankings aren't wasted. */
export async function trashPostsAction(form: FormData) {
  const me = await requireUser('editor');
  const ids = form.getAll('id').map(Number).filter(Boolean);
  if (!ids.length) return;
  const rows = await db.select({ id: s.posts.id, slug: s.posts.slug, status: s.posts.status }).from(s.posts).where(inArray(s.posts.id, ids));
  await db.update(s.posts).set({ status: 'trash', modifiedAt: new Date() }).where(inArray(s.posts.id, ids));
  for (const r of rows) if (r.status !== 'draft')
    await db.insert(s.redirects).values({ fromPath: `/${r.slug}/`, toPath: '/المدونة/', code: 301, note: 'مقال محذوف' }).onConflictDoNothing();
  await audit(me.id, 'post.trash', { entity: 'post', entityId: ids.join(','), data: { slugs: rows.map((r) => r.slug) } });
  invalidateRedirects();
  refreshPublic(...rows.map((r) => r.slug));
  revalidatePath('/admin/posts/');
}

export async function restorePostAction(form: FormData) {
  const me = await requireUser('editor');
  const id = Number(form.get('id'));
  const [p] = await db.update(s.posts).set({ status: 'draft' }).where(eq(s.posts.id, id)).returning({ slug: s.posts.slug });
  if (p) await db.delete(s.redirects).where(and(eq(s.redirects.fromPath, `/${p.slug}/`), eq(s.redirects.toPath, '/المدونة/')));
  await audit(me.id, 'post.restore', { entity: 'post', entityId: id });
  invalidateRedirects();
  revalidatePath('/admin/posts/');
}
