'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';
import { invalidateRedirects } from '@/lib/redirects';
import type { FormState } from '../../auth-actions';

const normFrom = (p: string) => {
  let x = p.trim();
  try { x = decodeURIComponent(x); } catch {}
  x = x.replace(/^https?:\/\/[^/]+/, '');
  if (!x.startsWith('/')) x = '/' + x;
  return x.includes('.') || x.endsWith('/') ? x : x + '/';
};

export async function saveRedirectAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('editor');
  const from = normFrom(String(form.get('from') || ''));
  let to = String(form.get('to') || '').trim();
  const code = Number(form.get('code'));
  if (![301, 302, 410].includes(code)) return { error: 'نوع غير صالح.' };
  if (from === '/' || from.startsWith('/admin') || from.startsWith('/api/') || from.startsWith('/_next/')) return { error: 'لا يمكن تحويل هذا المسار.' };
  if (code !== 410) {
    if (!to) return { error: 'أدخل الوجهة.' };
    if (!/^https:\/\//.test(to)) { to = normFrom(to); if (to === from) return { error: 'الوجهة نفس المصدر.' }; }
  } else to = '';
  await db.insert(s.redirects).values({ fromPath: from, toPath: to, code, note: String(form.get('note') || '').slice(0, 200) || null })
    .onConflictDoUpdate({ target: s.redirects.fromPath, set: { toPath: to, code } });
  await audit(me.id, 'redirect.save', { entity: 'redirect', data: { from, to, code } });
  invalidateRedirects();
  revalidatePath('/admin/redirects/');
  return { ok: 'تم الحفظ.' };
}

export async function deleteRedirectAction(form: FormData) {
  const me = await requireUser('editor');
  const id = Number(form.get('id'));
  const [r] = await db.delete(s.redirects).where(eq(s.redirects.id, id)).returning();
  await audit(me.id, 'redirect.delete', { entity: 'redirect', entityId: id, data: r });
  invalidateRedirects();
  revalidatePath('/admin/redirects/');
}
