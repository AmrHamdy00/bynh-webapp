import 'server-only';
/** CSRF guard for admin route handlers: the request must come from a page on the same host. */
export function sameOrigin(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;          // modern browsers: authoritative
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (origin && origin !== 'null') { try { return new URL(origin).host === host; } catch { return false; } }
  return site === 'same-origin';
}
export const seeOther = (to: string) => new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store' } });
