import 'server-only';
import { eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { currentSession } from './session';
import { openSecret, sealSecret, newTotpSecret } from './totp';

/** Step 1 of enrolment: create (or reuse) a pending secret, stored encrypted until confirmed. */
export async function pendingTotp() {
  const sess = await currentSession();
  if (!sess || sess.stage !== 'setup') return null;
  const [u] = await db.select().from(s.users).where(eq(s.users.id, sess.id)).limit(1);
  if (!u || u.totpEnabled) return null;
  let secret = u.totpSecret ? openSecret(u.totpSecret) : null;
  if (!secret) { secret = newTotpSecret(); await db.update(s.users).set({ totpSecret: sealSecret(secret) }).where(eq(s.users.id, u.id)); }
  return { username: u.username, secret };
}

