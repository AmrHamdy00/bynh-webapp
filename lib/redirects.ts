import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db, schema as s } from './db';

/** In-memory copy of the redirects table (refreshed every 60 s and right after admin edits). */
type R = { to: string; code: number };
let cache: { at: number; map: Map<string, R> } | null = null;
let loading: Promise<Map<string, R>> | null = null;

export function invalidateRedirects() { cache = null; }

export async function redirectMap() {
  if (cache && Date.now() - cache.at < 60_000) return cache.map;
  loading ??= db.select({ from: s.redirects.fromPath, to: s.redirects.toPath, code: s.redirects.code }).from(s.redirects)
    .then((rows) => new Map(rows.map((r) => [r.from, { to: r.to, code: r.code }])))
    .finally(() => { loading = null; });
  const map = await loading;
  cache = { at: Date.now(), map };
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
