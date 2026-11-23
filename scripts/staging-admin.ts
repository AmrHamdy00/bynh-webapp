/**
 * Staging only: sets the admin account's password from STAGING_ADMIN_PASSWORD on every build (creates the account if
 * missing), with no forced change. Refuses to run unless STAGING=1.
 *   STAGING_ADMIN_USER (default "amr"), STAGING_ADMIN_PASSWORD
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import * as s from '../lib/db/schema';
import { dbUrl, isPooled } from '../lib/db/url';

async function main() {
  if (process.env.STAGING !== '1') { console.log('staging-admin: STAGING is not 1 — skipped'); return; }
  const pw = process.env.STAGING_ADMIN_PASSWORD;
  if (!pw || pw.length < 12) { console.log('staging-admin: STAGING_ADMIN_PASSWORD missing or < 12 chars — skipped'); return; }
  const username = (process.env.STAGING_ADMIN_USER || 'amr').toLowerCase();
  const client = postgres(dbUrl(true), { max: 1, prepare: !isPooled(dbUrl(true)) });
  const db = drizzle(client, { schema: s });
  const passwordHash = await hash(pw, { algorithm: 2, memoryCost: 65536, timeCost: 3, parallelism: 1, outputLen: 32 });
  const [u] = await db.select().from(s.users).where(eq(s.users.username, username));
  if (u) await db.update(s.users).set({ passwordHash, mustChangePassword: false, failedCount: 0, lockedUntil: null, disabled: false }).where(eq(s.users.id, u.id));
  else await db.insert(s.users).values({ username, displayName: username, role: 'admin', passwordHash, mustChangePassword: false });
  await db.insert(s.auditLog).values({ action: 'staging.admin_password_set', data: { username } });
  console.log(`staging-admin: password set for ${username}`);
  await client.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
