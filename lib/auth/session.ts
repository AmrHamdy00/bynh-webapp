import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, lt, sql, count } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { sha256, token } from './crypto';
import { MFA_DISABLED } from './flags';

/**
 * Admin sessions.
 *  - 256-bit random token in an HttpOnly, Secure, SameSite=Strict, host-only cookie (__Host- prefix in production);
 *    only its SHA-256 is stored, so a database leak does not leak sessions.
 *  - Stages: "mfa" (password ok, 5 min to enter the code) → "full". "setup" = must enrol an authenticator first.
 *  - Idle timeout 30 min, absolute lifetime 12 h, new token on every stage change (no fixation).
 */
const PROD = process.env.NODE_ENV === 'production';
export const COOKIE = PROD ? '__Host-bynh_admin' : 'bynh_admin';
const IDLE_MS = 30 * 60_000;
const ABSOLUTE_MS = 12 * 60 * 60_000;
const PENDING_MS = 5 * 60_000;

export type Role = 'admin' | 'editor' | 'author';
export type SessionUser = { id: number; username: string; displayName: string; role: Role; stage: 'mfa' | 'setup' | 'full'; mustChangePassword: boolean; sessionId: string };

/**
 * Client IP as set by nginx (X-Real-IP). Only trusted with TRUST_PROXY=1, i.e. when the app listens on 127.0.0.1
 * behind nginx — otherwise a client could forge the header to dodge rate limits.
 */
export async function clientIp() {
  if (process.env.TRUST_PROXY !== '1') return 'local';
  return ((await headers()).get('x-real-ip') || 'unknown').slice(0, 64);
}

export async function audit(userId: number | null, action: string, extra: { entity?: string; entityId?: string | number; data?: unknown } = {}) {
  await db.insert(s.auditLog).values({ userId, action, entity: extra.entity, entityId: extra.entityId != null ? String(extra.entityId) : undefined,
    data: extra.data as never, ip: await clientIp() });
}

export async function createSession(userId: number, stage: SessionUser['stage']) {
  const raw = token();
  const h = await headers();
  const life = stage === 'full' ? ABSOLUTE_MS : PENDING_MS;
  await db.insert(s.sessions).values({ id: sha256(raw), userId, stage, expiresAt: new Date(Date.now() + life), ip: await clientIp(), userAgent: (h.get('user-agent') || '').slice(0, 300) });
  (await cookies()).set(COOKIE, raw, { httpOnly: true, secure: PROD, sameSite: 'strict', path: '/', maxAge: Math.floor(life / 1000) });
}

export async function destroySession() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (raw) await db.delete(s.sessions).where(eq(s.sessions.id, sha256(raw)));
  (await cookies()).delete(COOKIE);
}

/** Replaces the current session with a new token at a new stage. */
export async function promoteSession(userId: number, stage: SessionUser['stage']) {
  await destroySession();
  await createSession(userId, stage);
}

export async function currentSession(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw || raw.length > 100) return null;
  const id = sha256(raw);
  const [r] = await db.select({ sess: s.sessions, user: s.users }).from(s.sessions).innerJoin(s.users, eq(s.users.id, s.sessions.userId))
    .where(and(eq(s.sessions.id, id), gt(s.sessions.expiresAt, sql`now()`))).limit(1);
  if (!r || r.user.disabled) return null;
  if (r.sess.stage === 'full') {
    if (Date.now() - r.sess.lastSeenAt.getTime() > IDLE_MS) { await db.delete(s.sessions).where(eq(s.sessions.id, id)); return null; }
    // a password change ends every session started before it
    if (r.sess.createdAt < r.user.passwordChangedAt) { await db.delete(s.sessions).where(eq(s.sessions.id, id)); return null; }
    if (Date.now() - r.sess.lastSeenAt.getTime() > 60_000) await db.update(s.sessions).set({ lastSeenAt: new Date() }).where(eq(s.sessions.id, id));
  }
  return { id: r.user.id, username: r.user.username, displayName: r.user.displayName, role: r.user.role, stage: r.sess.stage,
    mustChangePassword: r.user.mustChangePassword, sessionId: id };
}

const RANK: Record<Role, number> = { author: 1, editor: 2, admin: 3 };
export const can = (u: { role: Role }, min: Role) => RANK[u.role] >= RANK[min];

/** For admin pages and server actions: a fully signed-in user with at least `min` role, otherwise redirect/throw. */
export async function requireUser(min: Role = 'author'): Promise<SessionUser> {
  const u = await currentSession();
  if (!u) redirect('/admin/login/');
  if (u.stage === 'mfa') redirect('/admin/login/code/');
  if (u.stage === 'setup') redirect('/admin/setup-2fa/');
  if (!MFA_DISABLED && u.mustChangePassword && !((await headers()).get('x-admin-path') || '').startsWith('/admin/account')) redirect('/admin/account/?change=1');
  if (!can(u, min)) redirect('/admin/?denied=1');
  return u;
}

/* ───────── brute-force protection ───────── */

const WINDOW = sql`now() - interval '15 minutes'`;
export async function tooManyAttempts(ip: string, username?: string) {
  const [byIp] = await db.select({ n: count() }).from(s.loginAttempts).where(and(eq(s.loginAttempts.ip, ip), eq(s.loginAttempts.success, false), gt(s.loginAttempts.at, WINDOW)));
  if (byIp.n >= 20) return true;
  if (username) {
    const [byUser] = await db.select({ n: count() }).from(s.loginAttempts).where(and(eq(s.loginAttempts.username, username), eq(s.loginAttempts.success, false), gt(s.loginAttempts.at, WINDOW)));
    if (byUser.n >= 10) return true;
  }
  return false;
}
export async function recordAttempt(kind: 'password' | 'totp' | 'recovery', ip: string, username: string | null, success: boolean) {
  await db.insert(s.loginAttempts).values({ kind, ip, username, success });
}

/** Per-account lock: 5 failures → 15 min, doubling with each further lock (max 24 h). */
export async function registerFailure(userId: number) {
  const [u] = await db.update(s.users).set({ failedCount: sql`${s.users.failedCount} + 1` }).where(eq(s.users.id, userId)).returning({ n: s.users.failedCount });
  if (u && u.n >= 5 && u.n % 5 === 0) {
    const minutes = Math.min(15 * 2 ** (u.n / 5 - 1), 1440);
    await db.update(s.users).set({ lockedUntil: new Date(Date.now() + minutes * 60_000) }).where(eq(s.users.id, userId));
    await audit(userId, 'account_locked', { data: { minutes } });
  }
}
export async function clearFailures(userId: number) {
  await db.update(s.users).set({ failedCount: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(s.users.id, userId));
}

/** Housekeeping: expired sessions and old attempts (called opportunistically on login). */
export async function sweep() {
  await db.delete(s.sessions).where(lt(s.sessions.expiresAt, sql`now()`));
  await db.delete(s.loginAttempts).where(lt(s.loginAttempts.at, sql`now() - interval '30 days'`));
}
