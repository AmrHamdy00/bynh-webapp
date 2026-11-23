import { and, desc, ilike, like, or, sql, count } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { currentSession, audit, can } from '@/lib/auth/session';
import { sameOrigin } from '@/lib/auth/origin';
import { storeUpload } from '@/lib/media';
import { cleanText } from '@/lib/sanitize';

const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { 'Cache-Control': 'no-store' } });
async function user() { const u = await currentSession(); return u && u.stage === 'full' && !u.mustChangePassword ? u : null; }

/** Media library listing for the editor picker and the media page. */
export async function GET(req: Request) {
  if (!(await user())) return json({ error: 'unauthorized' }, 401);
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const q = (url.searchParams.get('q') || '').slice(0, 100);
  const conds = [];
  if (q) conds.push(or(ilike(s.media.path, `%${q}%`), ilike(s.media.alt, `%${q}%`), ilike(s.media.title, `%${q}%`)));
  if (url.searchParams.get('images')) conds.push(like(s.media.mime, 'image/%'));
  const where = conds.length ? and(...conds) : undefined;
  const items = await db.select().from(s.media).where(where).orderBy(desc(s.media.createdAt), desc(s.media.id)).limit(40).offset((page - 1) * 40);
  const [{ n }] = await db.select({ n: count() }).from(s.media).where(where);
  return json({ items, more: page * 40 < n, total: n });
}

/** Upload (multipart: file, alt). */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'forbidden' }, 403);
  const u = await user();
  if (!u || !can(u, 'author')) return json({ error: 'unauthorized' }, 401);
  const [{ n }] = await db.select({ n: count() }).from(s.media).where(sql`${s.media.uploadedBy} = ${u.id} and ${s.media.createdAt} > now() - interval '1 hour'`);
  if (n >= 100) return json({ error: 'تم تجاوز حد الرفع (100 ملف في الساعة).' }, 429);
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return json({ error: 'لم يتم اختيار ملف.' }, 400);
  try {
    const m = await storeUpload(file, cleanText(form.get('alt'), 300), u.id);
    await audit(u.id, 'media.upload', { entity: 'media', entityId: m.id, data: { path: m.path } });
    return json(m);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'فشل الرفع' }, 400);
  }
}
