'use server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';
import { cleanText } from '@/lib/sanitize';
import { PAGES, PAGES_TAG } from '@/lib/seo';
import type { FormState } from '../../auth-actions';

export async function savePageSeoAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('editor');
  const path = String(form.get('path'));
  if (!(path in PAGES)) return { error: 'صفحة غير معروفة.' };
  const [row] = await db.select().from(s.pageSeo).where(eq(s.pageSeo.path, path));
  const seo = { ...(row?.seo || {}),
    title: cleanText(form.get('title'), 200) || undefined, description: cleanText(form.get('description'), 400) || undefined,
    ogTitle: cleanText(form.get('ogTitle'), 200) || undefined, ogDescription: cleanText(form.get('ogDescription'), 400) || undefined,
    robots: form.get('noindex') ? 'noindex, follow' : row?.seo?.robots?.includes('noindex') ? undefined : row?.seo?.robots };
  await db.insert(s.pageSeo).values({ path, name: row?.name || path, seo, modifiedAt: new Date() })
    .onConflictDoUpdate({ target: s.pageSeo.path, set: { seo, modifiedAt: new Date() } });
  await audit(me.id, 'page_seo.update', { entity: 'page', entityId: path });
  revalidateTag(PAGES_TAG);
  revalidatePath(path);
  return { ok: 'تم الحفظ.' };
}
