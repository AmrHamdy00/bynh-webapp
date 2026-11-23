'use server';
/**
 * Sign-in flow: password → authenticator code (or a recovery code) → full session.
 * Server Actions are POST-only and Next.js rejects them when Origin ≠ Host (CSRF); the cookie is SameSite=Strict too.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { verifyPassword, hashPassword, passwordProblem } from '@/lib/auth/password';
import { checkTotp, openSecret, newRecoveryCodes, normalizeRecovery } from '@/lib/auth/totp';
import { sha256 } from '@/lib/auth/crypto';
import {
  currentSession, createSession, promoteSession, clientIp, audit, tooManyAttempts, recordAttempt,
  registerFailure, clearFailures, sweep, requireUser,
} from '@/lib/auth/session';

/** `go`: the client does a full navigation there. (redirect() inside actions makes Next fetch the target over HTTP
 * from the server itself, which breaks behind nginx/TLS — so the auth flow never relies on it.) */
export type FormState = { error?: string; ok?: string; codes?: string[]; go?: string } | undefined;
const GENERIC = 'اسم المستخدم أو كلمة المرور غير صحيحة.';
const slow = () => new Promise((r) => setTimeout(r, 300 + Math.random() * 300));

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const username = String(form.get('username') || '').trim().toLowerCase().slice(0, 64);
  const password = String(form.get('password') || '').slice(0, 256);
  const ip = await clientIp();
  if (!username || !password) return { error: GENERIC };
  if (await tooManyAttempts(ip, username)) { await slow(); return { error: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.' }; }

  const [u] = await db.select().from(s.users).where(eq(s.users.username, username)).limit(1);
  const ok = await verifyPassword(u?.passwordHash ?? null, password);
  await recordAttempt('password', ip, username, ok && !!u);
  if (!u || !ok) { if (u) { await registerFailure(u.id); await audit(u.id, 'login_failed', { data: { step: 'password' } }); } await slow(); return { error: GENERIC }; }
  if (u.disabled) { await audit(u.id, 'login_blocked_disabled'); return { error: GENERIC }; }
  if (u.lockedUntil && u.lockedUntil > new Date()) { await audit(u.id, 'login_blocked_locked'); return { error: 'الحساب مقفل مؤقتاً بسبب محاولات خاطئة. حاول لاحقاً.' }; }

  await sweep();
  if (u.totpEnabled) { await createSession(u.id, 'mfa'); return { go: '/admin/login/code/' }; }
  await createSession(u.id, 'setup');
  await audit(u.id, 'login_password_ok_setup_required');
  return { go: '/admin/setup-2fa/' };
}

export async function codeAction(_: FormState, form: FormData): Promise<FormState> {
  const sess = await currentSession();
  if (!sess || sess.stage !== 'mfa') return { go: '/admin/login/' };
  const ip = await clientIp();
  if (await tooManyAttempts(ip, sess.username)) return { error: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.' };
  const [u] = await db.select().from(s.users).where(eq(s.users.id, sess.id)).limit(1);
  if (!u?.totpSecret || !u.totpEnabled) return { go: '/admin/login/' };
  if (u.lockedUntil && u.lockedUntil > new Date()) return { error: 'الحساب مقفل مؤقتاً بسبب محاولات خاطئة. حاول لاحقاً.' };

  const mode = form.get('mode') === 'recovery' ? 'recovery' : 'totp';
  const code = String(form.get('code') || '').slice(0, 64);
  let ok = false;
  if (mode === 'totp') {
    const step = checkTotp(openSecret(u.totpSecret), code);
    if (step !== null && (u.totpLastStep == null || step > u.totpLastStep)) {
      // atomic: only one request can consume this step
      const upd = await db.update(s.users).set({ totpLastStep: step })
        .where(and(eq(s.users.id, u.id), sql`coalesce(${s.users.totpLastStep}, 0) < ${step}`)).returning({ id: s.users.id });
      ok = upd.length === 1;
    }
  } else {
    const upd = await db.update(s.recoveryCodes).set({ usedAt: new Date() })
      .where(and(eq(s.recoveryCodes.userId, u.id), eq(s.recoveryCodes.codeHash, sha256(normalizeRecovery(code))), isNull(s.recoveryCodes.usedAt))).returning({ id: s.recoveryCodes.id });
    ok = upd.length === 1;
  }
  await recordAttempt(mode, ip, u.username, ok);
  if (!ok) { await registerFailure(u.id); await audit(u.id, 'login_failed', { data: { step: mode } }); await slow(); return { error: 'الرمز غير صحيح أو مستخدم من قبل.' }; }

  await clearFailures(u.id);
  await promoteSession(u.id, 'full');
  await audit(u.id, mode === 'recovery' ? 'login_with_recovery_code' : 'login');
  return { go: u.mustChangePassword ? '/admin/account/?change=1' : '/admin/' };
}

/** Step 2: confirm with a code from the app → enable 2FA, issue recovery codes, full session. */
export async function confirmTotpAction(_: FormState, form: FormData): Promise<FormState> {
  const sess = await currentSession();
  if (!sess || sess.stage !== 'setup') return { go: '/admin/login/' };
  const [u] = await db.select().from(s.users).where(eq(s.users.id, sess.id)).limit(1);
  if (!u?.totpSecret) return { go: '/admin/setup-2fa/' };
  const step = checkTotp(openSecret(u.totpSecret), String(form.get('code') || ''));
  if (step === null) return { error: 'الرمز غير صحيح. تأكد من ضبط وقت الجوال تلقائياً ثم أعد المحاولة.' };
  const { codes, hashes } = newRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.update(s.users).set({ totpEnabled: true, totpLastStep: step }).where(eq(s.users.id, u.id));
    await tx.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, u.id));
    await tx.insert(s.recoveryCodes).values(hashes.map((codeHash) => ({ userId: u.id, codeHash })));
  });
  await clearFailures(u.id);
  // No cookie change here (that would re-render this page and lose the codes on screen): the session row is upgraded
  // in place, and "continue" (POST /api/admin/session/rotate) swaps it for a fresh 12-hour token.
  await db.update(s.sessions).set({ stage: 'full', expiresAt: new Date(Date.now() + 10 * 60_000) }).where(eq(s.sessions.id, sess.sessionId));
  await audit(u.id, 'totp_enabled');
  return { codes };
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(form.get('current') || '');
  const next = String(form.get('next') || '');
  if (next !== String(form.get('confirm') || '')) return { error: 'كلمتا المرور غير متطابقتين.' };
  const [u] = await db.select().from(s.users).where(eq(s.users.id, me.id)).limit(1);
  if (!(await verifyPassword(u.passwordHash, current))) { await audit(me.id, 'password_change_failed'); return { error: 'كلمة المرور الحالية غير صحيحة.' }; }
  const problem = passwordProblem(next, u.username);
  if (problem) return { error: problem };
  await db.update(s.users).set({ passwordHash: await hashPassword(next), passwordChangedAt: new Date(), mustChangePassword: false }).where(eq(s.users.id, me.id));
  await audit(me.id, 'password_changed');
  // the change signs out every other session (see currentSession); give this browser a fresh one
  await promoteSession(me.id, 'full');
  return { ok: 'تم تغيير كلمة المرور، وتم تسجيل الخروج من الأجهزة الأخرى.' };
}

export async function regenerateRecoveryAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const [u] = await db.select().from(s.users).where(eq(s.users.id, me.id)).limit(1);
  if (!(await verifyPassword(u.passwordHash, String(form.get('password') || '')))) return { error: 'كلمة المرور غير صحيحة.' };
  const { codes, hashes } = newRecoveryCodes();
  await db.transaction(async (tx) => {
    await tx.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, me.id));
    await tx.insert(s.recoveryCodes).values(hashes.map((codeHash) => ({ userId: me.id, codeHash })));
  });
  await audit(me.id, 'recovery_codes_regenerated');
  return { codes };
}

