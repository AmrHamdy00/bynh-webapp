import { currentSession, promoteSession } from '@/lib/auth/session';
import { sameOrigin, seeOther } from '@/lib/auth/origin';

/** Issues a fresh session token (after 2FA enrolment). Only for an already fully signed-in session. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
  const me = await currentSession();
  if (!me || me.stage !== 'full') return seeOther('/admin/login/');
  await promoteSession(me.id, 'full');
  const next = String((await req.formData()).get('next') || '/admin/');
  return seeOther(next.startsWith('/admin/') ? next : '/admin/');
}
