'use server';
import { revalidatePath } from 'next/cache';
import { eq, like, or, count } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';
import { cleanText } from '@/lib/sanitize';
import { deleteFiles } from '@/lib/media';
import type { FormState } from '../../auth-actions';

export async function updateMediaAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('author');
  const id = Number(form.get('id'));
  await db.update(s.media).set({ alt: cleanText(form.get('alt'), 300), title: cleanText(form.get('title'), 200) }).where(eq(s.media.id, id));
  await audit(me.id, 'media.update', { entity: 'media', entityId: id });
  revalidatePath('/admin/media/');
  return { ok: 'تم الحفظ.' };
}

/** Deletes a file only when no post uses it (as cover or inside the text) — avoids broken images on live pages. */
export async function deleteMediaAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('editor');
  const id = Number(form.get('id'));
  const [m] = await db.select().from(s.media).where(eq(s.media.id, id));
  if (!m) return { error: 'غير موجود.' };
  const base = m.path.replace(/\.[^.]+$/, '');
  const [{ n }] = await db.select({ n: count() }).from(s.posts).where(or(eq(s.posts.coverMediaId, id), like(s.posts.content, `%${base}%`)));
  if (n) return { error: `الملف مستخدم في ${n} مقال — احذفه من المقالات أولاً.` };
  await db.delete(s.media).where(eq(s.media.id, id));
  await deleteFiles([m.path, ...Object.values(m.sizes || {}).map((x) => x.path)]);
  await audit(me.id, 'media.delete', { entity: 'media', entityId: id, data: { path: m.path } });
  revalidatePath('/admin/media/');
  return { ok: 'تم الحذف.' };
}
