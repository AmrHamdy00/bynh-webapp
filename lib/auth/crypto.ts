import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * APP_SECRET: 32+ random bytes, base64 (generate with `openssl rand -base64 48`). Used to encrypt TOTP secrets at
 * rest (AES-256-GCM) and to derive the daily analytics salt. Required in production.
 */
function key(purpose: string) {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('APP_SECRET is missing or too short');
    return createHash('sha256').update(`dev-only-secret:${purpose}`).digest();
  }
  return createHmac('sha256', secret).update(purpose).digest();
}

export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key('totp-v1'), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decrypt(box: string) {
  const [v, iv, tag, data] = box.split('.');
  if (v !== 'v1') throw new Error('unknown box version');
  const d = createDecipheriv('aes-256-gcm', key('totp-v1'), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const token = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const hmac = (purpose: string, s: string) => createHmac('sha256', key(purpose)).update(s).digest('hex');
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
