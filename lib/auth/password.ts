import 'server-only';
import { hash, verify } from '@node-rs/argon2';

/** argon2id with OWASP-recommended cost (64 MiB, 3 passes). */
const OPTS = { algorithm: 2 as const, memoryCost: 65536, timeCost: 3, parallelism: 1, outputLen: 32 };

export const hashPassword = (pw: string) => hash(pw, OPTS);

// Verifying against this when the user does not exist keeps response time the same (no username probing).
let dummy: Promise<string> | null = null;
export async function verifyPassword(stored: string | null, pw: string) {
  if (!stored) { await verify(await (dummy ??= hash('not-a-real-password', OPTS)), pw).catch(() => false); return false; }
  try { return await verify(stored, pw); } catch { return false; }
}

const COMMON = ['password', '123456', 'qwerty', 'bynh', 'bayyinah', 'admin', 'letmein', 'welcome', '1q2w3e', 'iloveyou', 'saudi', 'riyadh'];

/** Returns an Arabic error message, or null when the password is acceptable. */
export function passwordProblem(pw: string, username: string): string | null {
  if (pw.length < 12) return 'كلمة المرور يجب ألا تقل عن 12 حرفاً.';
  if (pw.length > 128) return 'كلمة المرور طويلة جداً.';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length + (/[؀-ۿ]/.test(pw) ? 1 : 0);
  if (classes < 3) return 'استخدم مزيجاً من الأحرف الكبيرة والصغيرة والأرقام والرموز.';
  const low = pw.toLowerCase();
  if (username && low.includes(username.toLowerCase())) return 'لا تضمّن اسم المستخدم في كلمة المرور.';
  if (COMMON.some((c) => low.includes(c))) return 'كلمة المرور سهلة التخمين.';
  if (/(.)\1{3,}/.test(pw)) return 'تجنّب تكرار الحرف نفسه.';
  return null;
}
