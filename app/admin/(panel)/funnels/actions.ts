'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';
import { cleanText } from '@/lib/sanitize';
import type { FormState } from '../../auth-actions';

export async function saveFunnelAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('editor');
  const name = cleanText(form.get('name'), 100);
  const types = form.getAll('type').map(String), matches = form.getAll('match').map((m) => cleanText(m, 200)), labels = form.getAll('label').map((m) => cleanText(m, 80));
  const steps = types.map((type, i) => ({ type: type as 'pageview' | 'click' | 'form', match: matches[i], label: labels[i] || matches[i] }))
    .filter((st) => ['pageview', 'click', 'form'].includes(st.type) && st.match);
  if (!name || steps.length < 2) return { error: 'أدخل اسماً وخطوتين على الأقل.' };
  const [f] = await db.insert(s.funnels).values({ name, steps, createdBy: me.id }).returning();
  await audit(me.id, 'funnel.create', { entity: 'funnel', entityId: f.id });
  revalidatePath('/admin/funnels/');
  return { ok: 'تم إنشاء المسار.' };
}

export async function deleteFunnelAction(form: FormData) {
  const me = await requireUser('editor');
  const id = Number(form.get('id'));
  await db.delete(s.funnels).where(eq(s.funnels.id, id));
  await audit(me.id, 'funnel.delete', { entity: 'funnel', entityId: id });
  revalidatePath('/admin/funnels/');
}
