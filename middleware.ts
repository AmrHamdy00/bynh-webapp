/**
 * Runs before every request (Node.js runtime):
 *  1. admin.bynh.sa → the /admin app; the public host never serves /admin or admin APIs.
 *  2. Old WordPress addresses (tag/category/author archives, ?s= search, ?p= ids, wp-admin…) → their new home.
 *  3. Redirects managed in the admin (slug changes, removed pages) — 301/302/410.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { redirectMap, countHit, slugForWpId } from '@/lib/redirects';

const ADMIN_PREFIX = '/admin';
const BLOG = '/المدونة/';
const isAdminHost = (host: string) => host.split(':')[0].startsWith('admin.');
const enc = (p: string) => p.split('/').map((x) => encodeURIComponent(x)).join('/');

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get('host') || '';
  let path = url.pathname;
  try { path = decodeURIComponent(path); } catch {}

  /* 1. admin host */
  if (isAdminHost(host)) {
    if (path === '/' ) return NextResponse.redirect(new URL('/admin/', url));
    const ok = path.startsWith(ADMIN_PREFIX + '/') || path === ADMIN_PREFIX || path.startsWith('/api/admin/') || path.startsWith('/_next/') || path.startsWith('/img/') || path.startsWith('/wp-content/') || path === '/favicon.ico';
    if (!ok) return new NextResponse('Not found', { status: 404 });
    // optional network allow-list, e.g. ADMIN_ALLOWED_IPS="203.0.113.4,198.51.100.0" (exact IPs, as seen by nginx)
    const allow = (process.env.ADMIN_ALLOWED_IPS || '').split(',').map((x) => x.trim()).filter(Boolean);
    if (allow.length && !allow.includes(req.headers.get('x-real-ip') || '')) return new NextResponse('Forbidden', { status: 403 });
    // strict CSP with a per-request nonce: no inline or third-party script can run in the dashboard
    const nonce = btoa(crypto.randomUUID());
    const dev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`, "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:", "font-src 'self'", `connect-src 'self'${dev ? ' ws:' : ''}`, "frame-ancestors 'none'", "base-uri 'none'",
      "form-action 'self'", "object-src 'none'", ...(dev ? [] : ['upgrade-insecure-requests']),
    ].join('; ');
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set('x-nonce', nonce);
    reqHeaders.set('content-security-policy', csp);
    reqHeaders.set('x-admin-path', path);
    const res = NextResponse.next({ request: { headers: reqHeaders } });
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  if (path === ADMIN_PREFIX || path.startsWith(ADMIN_PREFIX + '/') || path.startsWith('/api/admin/')) {
    return NextResponse.rewrite(new URL('/_not-found', url), { status: 404 });
  }

  /* 2. WordPress leftovers */
  if (path === '/' && url.searchParams.has('s')) {
    const q = url.searchParams.get('s') || '';
    return NextResponse.redirect(new URL(`${enc(BLOG)}${q ? `?q=${encodeURIComponent(q)}` : ''}`, url), 301);
  }
  if (path === '/' && url.searchParams.has('p')) {
    const slug = await slugForWpId(Number(url.searchParams.get('p'))).catch(() => undefined);
    if (slug) return NextResponse.redirect(new URL(enc(`/${slug}/`), url), 301);
  }
  if (/^\/(tag|category|author)\/[^/]+\/(page\/\d+\/?)?$/.test(path) || /^\/(tag|category|author)\/[^/]+$/.test(path)) {
    return NextResponse.redirect(new URL(enc(BLOG), url), 301);
  }
  if (/^\/(wp-admin|wp-includes)(\/|$)|^\/(wp-login|xmlrpc|wp-cron|wp-signup|wp-config)\.php|\.php$/.test(path)) {
    return new NextResponse('Gone', { status: 410, headers: { 'X-Robots-Tag': 'noindex' } });
  }
  // WordPress attachment and feed variants of a post: /<slug>/feed/, /<slug>/amp/, /<slug>/embed/
  const variant = /^(\/[^/]+\/)(feed|amp|embed)\/?$/.exec(path);
  if (variant && variant[1] !== '/feed/') return NextResponse.redirect(new URL(enc(variant[1]), url), 301);

  /* 3. managed redirects */
  const key = path.endsWith('/') || path.includes('.') ? path : path + '/';
  const r = (await redirectMap().catch(() => null))?.get(key);
  if (r) {
    countHit(key);
    if (r.code === 410) return new NextResponse('Gone', { status: 410 });
    const to = /^https?:\/\//.test(r.to) ? r.to : new URL(enc(r.to), url).toString();
    return NextResponse.redirect(to, r.code as 301 | 302 | 307 | 308);
  }
  return NextResponse.next();
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|img/|wp-content/uploads/|favicon.ico).*)'],
};
