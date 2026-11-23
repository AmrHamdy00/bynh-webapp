import { and, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { currentSession, audit } from '@/lib/auth/session';
import { sameOrigin, seeOther } from '@/lib/auth/origin';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
  const me = await currentSession();
  if (!me || me.stage !== 'full') return seeOther('/admin/login/');
  const id = String((await req.formData()).get('id') || '');
  await db.delete(s.sessions).where(and(eq(s.sessions.id, id), eq(s.sessions.userId, me.id)));
  await audit(me.id, 'session_revoked');
  return seeOther('/admin/account/');
}
