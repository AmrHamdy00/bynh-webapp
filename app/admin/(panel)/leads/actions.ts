'use server';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';

export async function setLeadStatusAction(form: FormData) {
  const me = await requireUser('editor');
  const id = Number(form.get('id'));
  const status = String(form.get('status')) as 'new' | 'contacted' | 'closed' | 'spam';
  if (!['new', 'contacted', 'closed', 'spam'].includes(status)) return;
  await db.update(s.leads).set({ status }).where(eq(s.leads.id, id));
  await audit(me.id, 'lead.status', { entity: 'lead', entityId: id, data: { status } });
  revalidatePath('/admin/leads/');
}
