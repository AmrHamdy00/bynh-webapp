import { currentSession, destroySession, audit } from '@/lib/auth/session';
import { sameOrigin, seeOther } from '@/lib/auth/origin';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response('Forbidden', { status: 403 });
  const s = await currentSession();
  if (s) await audit(s.id, 'logout');
  await destroySession();
  return seeOther('/admin/login/');
}
