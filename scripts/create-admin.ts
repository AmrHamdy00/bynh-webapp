/**
 * Creates (or resets) an admin account from the server's shell — there is no public sign-up.
 *   npm run admin:create -- <username> "<display name>" [admin|editor|author]
 * Prints a one-time temporary password. At first sign-in the user must change it and enrol an authenticator app.
 * Resetting an existing user also clears their 2FA and ends all their sessions.
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import * as s from '../lib/db/schema';

const [username, displayName, role = 'admin'] = process.argv.slice(2);
if (!username || !/^[a-z0-9._-]{3,32}$/i.test(username) || !displayName || !['admin', 'editor', 'author'].includes(role)) {
  console.error('usage: npm run admin:create -- <username> "<display name>" [admin|editor|author]'); process.exit(1);
}
async function main() {
  const client = postgres(process.env.DATABASE_URL || 'postgres://bynh:bynh_dev_pw@127.0.0.1:5432/bynh', { max: 1 });
  const db = drizzle(client, { schema: s });
  const temp = randomBytes(18).toString('base64url') + '!7a';
  const passwordHash = await hash(temp, { algorithm: 2, memoryCost: 65536, timeCost: 3, parallelism: 1, outputLen: 32 });
  const values = { username: username.toLowerCase(), displayName, role: role as 'admin', passwordHash, mustChangePassword: true,
    totpEnabled: false, totpSecret: null, totpLastStep: null, failedCount: 0, lockedUntil: null, disabled: false, passwordChangedAt: new Date() };
  const [existing] = await db.select().from(s.users).where(eq(s.users.username, values.username));
  if (existing) {
    await db.update(s.users).set(values).where(eq(s.users.id, existing.id));
    await db.delete(s.sessions).where(eq(s.sessions.userId, existing.id));
    await db.delete(s.recoveryCodes).where(eq(s.recoveryCodes.userId, existing.id));
    await db.insert(s.auditLog).values({ userId: existing.id, action: 'user.reset_from_cli' });
  } else {
    const [u] = await db.insert(s.users).values(values).returning();
    await db.insert(s.auditLog).values({ userId: u.id, action: 'user.create_from_cli', data: { role } });
  }
  console.log(`\n  user:      ${values.username} (${role})\n  temporary: ${temp}\n\n  Sign in at https://admin.bynh.sa — you will be asked to set up an authenticator app and a new password.\n`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
