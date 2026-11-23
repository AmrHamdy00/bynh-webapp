'use server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'node:crypto';
import { and, eq, ne } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, audit } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import type { FormState } from '../../auth-actions';

const tempPassword = () => randomBytes(15).toString('base64url') + '#9a';
const ROLES = ['admin', 'editor', 'author'] as const;
type Role = (typeof ROLES)[number];

export async function createUserAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('admin');
  const username = String(form.get('username') || '').trim().toLowerCase();
  const displayName = String(form.get('displayName') || '').trim().slice(0, 80);
  const email = String(form.get('email') || '').trim().slice(0, 120) || null;
  const role = String(form.get('role')) as Role;
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) return { error: 'اسم المستخدم: 3–32 حرفاً إنجليزياً أو أرقاماً أو . _ -' };
  if (!displayName) return { error: 'أدخل الاسم.' };
  if (!ROLES.includes(role)) return { error: 'دور غير صالح.' };
  const [exists] = await db.select({ id: s.users.id }).from(s.users).where(eq(s.users.username, username));
  if (exists) return { error: 'اسم المستخدم مستخدم.' };
  const temp = tempPassword();
  const [u] = await db.insert(s.users).values({ username, displayName, email, role, passwordHash: await hashPassword(temp), mustChangePassword: true }).returning();
  await audit(me.id, 'user.create', { entity: 'user', entityId: u.id, data: { username, role } });
  revalidatePath('/admin/users/');
  return { ok: `تم إنشاء الحساب. كلمة المرور المؤقتة (تظهر مرة واحدة): ${temp}` };
}

async function target(form: FormData, meId: number) {
  const id = Number(form.get('id'));
  if (!id || id === meId) throw new Error('not allowed on own account');
  return id;
}

export async function setRoleAction(form: FormData) {
  const me = await requireUser('admin');
  const id = await target(form, me.id);
  const role = String(form.get('role')) as Role;
  if (!ROLES.includes(role)) return;
  await db.update(s.users).set({ role }).where(eq(s.users.id, id));
  await audit(me.id, 'user.role', { entity: 'user', entityId: id, data: { role } });
  revalidatePath('/admin/users/');
}

export async function toggleDisabledAction(form: FormData) {
  const me = await requireUser('admin');
  const id = await target(form, me.id);
  const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
  await db.update(s.users).set({ disabled: !u.disabled }).where(eq(s.users.id, id));
  if (!u.disabled) await db.delete(s.sessions).where(eq(s.sessions.userId, id));
  await audit(me.id, u.disabled ? 'user.enable' : 'user.disable', { entity: 'user', entityId: id });
  revalidatePath('/admin/users/');
}

/** Clears password + 2FA: the person signs in with a new temporary password and enrols again. */
export async function resetAccessAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser('admin');
  const id = await target(form, me.id);
  const temp = tempPassword();
  await db.update(s.users).set({ passwordHash: await hashPassword(temp), mustChangePassword: true, totpEnabled: false, totpSecret: null, totpLastStep: null,
    failedCount: 0, lockedUntil: null, passwordChangedAt: new Date() }).where(eq(s.users.id, id));
  await db.delete(s.sessions).where(eq(s.sessions.userId, id));
  await db.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, id));
  await audit(me.id, 'user.reset_access', { entity: 'user', entityId: id });
  revalidatePath('/admin/users/');
  return { ok: `كلمة المرور المؤقتة الجديدة (تظهر مرة واحدة): ${temp}` };
}

export async function unlockAction(form: FormData) {
  const me = await requireUser('admin');
  const id = await target(form, me.id);
  await db.update(s.users).set({ failedCount: 0, lockedUntil: null }).where(and(eq(s.users.id, id), ne(s.users.id, me.id)));
  await audit(me.id, 'user.unlock', { entity: 'user', entityId: id });
  revalidatePath('/admin/users/');
}
