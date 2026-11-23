/**
 * Database URL from the environment. Accepts our names (DATABASE_URL / DATABASE_URL_UNPOOLED) and the ones the Vercel
 * storage integrations set (Supabase/Neon: POSTGRES_URL / POSTGRES_URL_NON_POOLING). `direct` = unpooled, for migrations
 * and imports. Vendor-specific query parameters (e.g. Supabase's `supa=`) are dropped — only sslmode is kept.
 */
const LOCAL = 'postgres://bynh:bynh_dev_pw@127.0.0.1:5432/bynh';
export function dbUrl(direct = false): string {
  const e = process.env;
  const raw = direct
    ? e.DATABASE_URL_UNPOOLED || e.POSTGRES_URL_NON_POOLING || e.DATABASE_URL || e.POSTGRES_URL
    : e.DATABASE_URL || e.POSTGRES_URL;
  if (!raw) return LOCAL;
  try {
    const u = new URL(raw);
    const ssl = u.searchParams.get('sslmode');
    u.search = ssl ? `?sslmode=${ssl}` : '';
    return u.toString();
  } catch { return raw; }
}
/** Pooled connections (pgbouncer / Supavisor / Neon pooler) can't use prepared statements. */
export const isPooled = (url: string) => /pooler|pgbouncer|:6543\//.test(url);
