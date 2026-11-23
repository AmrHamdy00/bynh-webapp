/** /التسجيل/ form → leads table (shown in the admin under «طلبات التسجيل»). */
import { db, schema as s } from '@/lib/db';
import { cleanText } from '@/lib/sanitize';
import { limited } from '@/lib/ratelimit';

const PACKAGES = ['تأسيس الشركة (1350 ريال)', 'تأسيس وهيكلة الشركة (2650 ريال)'];

export async function POST(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return Response.json({ error: 'forbidden' }, { status: 403 });
  const ip = req.headers.get('x-real-ip') || 'local';
  if (limited(`reg:${ip}`, 5, 60 * 60_000)) return Response.json({ error: 'too many' }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: 'bad request' }, { status: 400 }); }
  if (body.website) return Response.json({ ok: true }); // honeypot: bots fill hidden fields
  const data = {
    name: cleanText(body.name, 120), email: cleanText(body.email, 160), phone: cleanText(body.phone, 30),
    package: cleanText(body.package, 80), notes: cleanText(body.notes, 2000),
  };
  if (!data.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email) || !/^[+\d\s-]{8,20}$/.test(data.phone) || !PACKAGES.includes(data.package))
    return Response.json({ error: 'invalid' }, { status: 422 });
  await db.insert(s.leads).values({ form: 'register', data });
  return Response.json({ ok: true });
}
