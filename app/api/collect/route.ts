/**
 * Analytics collector. Validates and stores events from components/Tracker. No raw IP or user agent is stored:
 * the visitor id is HMAC(daily salt, ip + user agent) — unique per day, not reversible, not linkable across days.
 */
import { db, schema as s } from '@/lib/db';
import { hmac } from '@/lib/auth/crypto';
import { limited } from '@/lib/ratelimit';

const TYPES = new Set(['pageview', 'read', 'engage', 'click', 'form', 'notfound']);
const BOT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|curl|wget|python|java\/|go-http|axios|node-fetch|scrapy|httpclient/i;
const str = (v: unknown, max: number) => (typeof v === 'string' && v ? v.slice(0, max) : null);

function uaInfo(ua: string, width: number) {
  const device = /iPad|Tablet/i.test(ua) || (width >= 600 && width < 1024 && /Android/i.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
  return { device, browser, os };
}

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOT.test(ua)) return new Response(null, { status: 204 });
  const ip = req.headers.get('x-real-ip') || 'local';
  if (limited(`c:${ip}`, 120, 60_000)) return new Response(null, { status: 429 });
  const text = await req.text();
  if (text.length > 4000) return new Response(null, { status: 413 });
  let b: Record<string, unknown>;
  try { b = JSON.parse(text); } catch { return new Response(null, { status: 400 }); }
  const path = str(b.p, 300);
  const session = str(b.s, 40);
  const evs = Array.isArray(b.e) ? b.e.slice(0, 5) : [];
  if (!path || !path.startsWith('/') || !session || !evs.length) return new Response(null, { status: 400 });

  const day = new Date().toISOString().slice(0, 10);
  const visitor = hmac(`visitor-${day}`, `${ip}|${ua}`).slice(0, 24);
  const info = uaInfo(ua, Number(b.w) || 0);
  const country = (req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || req.headers.get('x-country-code') || '').slice(0, 2).toUpperCase() || null;
  const rows = evs.filter((e: any) => e && TYPES.has(e.t)).map((e: any) => ({
    type: e.t as string, path, session, visitor, ...info, country,
    title: e.t === 'pageview' ? str(b.ti, 200) : null,
    referrerHost: e.t === 'pageview' || e.t === 'notfound' ? str(b.r, 120) : null,
    utmSource: e.t === 'pageview' ? str(b.us, 80) : null, utmMedium: e.t === 'pageview' ? str(b.um, 80) : null, utmCampaign: e.t === 'pageview' ? str(b.uc, 120) : null,
    label: str(e.l, 140), value: Number.isFinite(e.v) ? Math.max(0, Math.min(100000, Math.round(e.v))) : null,
  }));
  if (rows.length) await db.insert(s.events).values(rows);
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
