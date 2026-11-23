import 'server-only';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'node:crypto';
import { encrypt, decrypt, sha256 } from './crypto';

// RFC 6238: 6 digits, 30 s steps, SHA-1 (what Google Authenticator, Microsoft Authenticator, Authy, 1Password expect).
authenticator.options = { digits: 6, step: 30, window: 1 };

export const newTotpSecret = () => authenticator.generateSecret(20);
export const sealSecret = (secret: string) => encrypt(secret);
export const openSecret = (box: string) => decrypt(box);

export async function totpQr(username: string, secret: string) {
  const uri = authenticator.keyuri(username, 'بيّنه Admin', secret);
  return QRCode.toDataURL(uri, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
}

/**
 * Checks a code and returns its time step, or null. The caller stores the step and rejects any step <= the last one
 * used, so an intercepted code can never be replayed.
 */
export function checkTotp(secret: string, code: string): number | null {
  const c = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return null;
  const delta = authenticator.checkDelta(c, secret);
  if (delta === null) return null;
  return Math.floor(Date.now() / 30000) + delta;
}

/** 10 single-use recovery codes, shown once; only their hashes are stored. */
export function newRecoveryCodes() {
  const codes = Array.from({ length: 10 }, () => {
    const s = randomBytes(8).toString('hex').toUpperCase();
    return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12)}`;
  });
  return { codes, hashes: codes.map((c) => sha256(c)) };
}
export const normalizeRecovery = (c: string) => c.toUpperCase().replace(/[^0-9A-F]/g, '').replace(/(.{4})(?=.)/g, '$1-');
