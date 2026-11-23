import 'server-only';
import { hmac, safeEqual } from './auth/crypto';

/** Signed, short-lived preview links for drafts on the public host (the admin cookie never leaves admin.bynh.sa). */
export function previewToken(id: number, minutes = 30) {
  const exp = Math.floor(Date.now() / 1000) + minutes * 60;
  return `${exp}.${hmac('preview-v1', `${id}.${exp}`).slice(0, 32)}`;
}
export function checkPreviewToken(id: number, token: string | undefined) {
  const [exp, sig] = (token || '').split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, hmac('preview-v1', `${id}.${exp}`).slice(0, 32));
}
