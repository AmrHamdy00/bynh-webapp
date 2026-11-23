import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db, schema as s } from './db';

/** In-memory copy of the redirects table (refreshed every 60 s and right after admin edits). */
type R = { to: string; code: number };
// middleware and route code are separate bundles in the same process: share the cache through globalThis
const g = globalThis as unknown as { __bynhRedirects?: { at: number; map: Map<string, R> } | null; __bynhRedirectsLoading?: Promise<Map<string, R>> | null };

export function invalidateRedirects() { g.__bynhRedirects = null; }

export async function redirectMap() {
  const c = g.__bynhRedirects;
  if (c && Date.now() - c.at < 60_000) return c.map;
  g.__bynhRedirectsLoading ??= db.select({ from: s.redirects.fromPath, to: s.redirects.toPath, code: s.redirects.code }).from(s.redirects)
    .then((rows) => new Map(rows.map((r) => [r.from, { to: r.to, code: r.code }])))
    .finally(() => { g.__bynhRedirectsLoading = null; });
  const map = await g.__bynhRedirectsLoading;
  g.__bynhRedirects = { at: Date.now(), map };
  return map;
}

export function countHit(from: string) {
  db.update(s.redirects).set({ hits: sql`${s.redirects.hits} + 1`, lastHitAt: sql`now()` }).where(eq(s.redirects.fromPath, from)).catch(() => {});
}

/** WordPress ?p=<id> links → slug. */
export async function slugForWpId(id: number) {
  const [r] = await db.select({ slug: s.posts.slug }).from(s.posts).where(eq(s.posts.wpId, id)).limit(1);
  return r?.slug;
}
