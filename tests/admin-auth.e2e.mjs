/**
 * End-to-end check of the admin sign-in security on a running server (npm start), using http://admin.localhost:3000.
 *   ADMIN_USER=siteadmin ADMIN_PASS='<temporary password>' node tests/admin-auth.e2e.mjs
 * Run on a fresh account (npm run admin:create) — repeated runs trip the brute-force limiter (by design).
 * Walks: wrong password → login → forced 2FA enrolment → recovery codes → forced password change → logout →
 * login with TOTP → code replay rejected → public host cannot reach /admin.
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright'); // pre-installed globally, or: npm i -D playwright
import { authenticator } from 'otplib';

const BASE = process.env.ADMIN_BASE || 'http://admin.localhost:3000';
const PUBLIC = process.env.PUBLIC_BASE || 'http://localhost:3000';
const USER = process.env.ADMIN_USER, PASS = process.env.ADMIN_PASS, NEWPASS = process.env.NEW_PASS || 'Bayyen#Strong-Pass-2026';
authenticator.options = { digits: 6, step: 30, window: 1 };
const shots = process.env.SHOTS;
let n = 0;
const ok = (c, m) => { if (!c) { console.error('✖ ' + m); process.exitCode = 1; } else console.log('✓ ' + m); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const snap = async (name) => shots && p.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png` });
const login = async (user, pass) => {
  await p.goto(`${BASE}/admin/login/`);
  await p.fill('#u', user); await p.fill('#p', pass); await p.click('button[type=submit]');
  await Promise.race([p.waitForURL((u) => !u.pathname.endsWith('/admin/login/'), { timeout: 8000 }), p.waitForSelector('.msg.err', { timeout: 8000 })]).catch(() => {});
};

// headers
const r = await p.goto(`${BASE}/admin/login/`);
const h = r.headers();
ok(/nonce-/.test(h['content-security-policy'] || ''), 'CSP with nonce on admin');
ok((h['x-robots-tag'] || '').includes('noindex'), 'admin is noindex');
ok(h['x-frame-options'] === 'DENY', 'admin cannot be framed');
await snap('login');

await login(USER, 'wrong-password');
ok(await p.isVisible('.msg.err'), 'wrong password rejected with generic message');

await login(USER, PASS);
ok(p.url().includes('/admin/setup-2fa/'), 'first login forces authenticator setup');
await snap('setup-2fa');
const secret = (await p.textContent('.secret')).replace(/\s/g, '');
await p.goto(`${BASE}/admin/account/`);
ok(p.url().includes('/admin/setup-2fa/'), 'dashboard blocked until 2FA enrolled');
await p.goto(`${BASE}/admin/setup-2fa/`);
await p.fill('#c', '000000'); await p.click('button[type=submit]');
await p.waitForTimeout(800);
ok(await p.isVisible('.msg.err'), 'wrong enrolment code rejected');
await p.fill('#c', authenticator.generate(secret)); await p.click('button[type=submit]');
await p.waitForSelector('.codes');
const codes = (await p.$$eval('.codes span', (els) => els.map((e) => e.textContent)));
ok(codes.length === 10, '10 recovery codes shown once');
await snap('recovery-codes');
await p.click('text=متابعة إلى لوحة التحكم');
await p.waitForLoadState('networkidle');
ok(p.url().includes('/admin/account/'), 'temporary password must be changed first');
await snap('must-change');
await p.fill('#cur', PASS); await p.fill('#nw', 'passwordpassword'); await p.fill('#cf', 'passwordpassword'); await p.click('form:has(#nw) button[type=submit]');
await p.waitForTimeout(800);
ok(await p.isVisible('.msg.err'), 'weak password rejected');
await p.fill('#cur', PASS); await p.fill('#nw', NEWPASS); await p.fill('#cf', NEWPASS); await p.click('form:has(#nw) button[type=submit]');
await p.waitForSelector('.msg.ok');
await p.goto(`${BASE}/admin/`);
ok(p.url().endsWith('/admin/'), 'dashboard reachable after password change');
await snap('dashboard');

const cookies = await ctx.cookies();
const c = cookies.find((x) => x.name.includes('bynh_admin'));
ok(c && c.httpOnly && c.sameSite === 'Strict', 'session cookie HttpOnly + SameSite=Strict');

await p.click('text=تسجيل الخروج'); await p.waitForLoadState('networkidle');
ok(p.url().includes('/admin/login/'), 'logout');
await p.goto(`${BASE}/admin/`);
ok(p.url().includes('/admin/login/'), 'old session no longer valid');

// TOTP sign-in, then replay of the same code must fail
await login(USER, NEWPASS);
ok(p.url().includes('/admin/login/code/'), 'password step leads to code step');
await snap('code');
// wait for a fresh 30 s window so the enrolment code's step can't collide
const wait = 30000 - (Date.now() % 30000) + 500; await p.waitForTimeout(wait);
const code = authenticator.generate(secret);
await p.fill('#c', code); await p.click('button[type=submit]'); await p.waitForURL(/\/admin\/$/, { timeout: 10000 }).catch(() => {});
ok(p.url().endsWith('/admin/'), 'signed in with authenticator code');
await p.click('text=تسجيل الخروج'); await p.waitForLoadState('networkidle');
await login(USER, NEWPASS);
await p.fill('#c', code); await p.click('button[type=submit]'); await p.waitForTimeout(1000);
ok(p.url().includes('/admin/login/code/') && await p.isVisible('.msg.err'), 'same code cannot be replayed');
await p.goto(`${BASE}/admin/login/code/?recovery=1`);
await p.fill('#c', codes[0]); await p.click('button[type=submit]'); await p.waitForURL(/\/admin\/$/, { timeout: 10000 }).catch(() => {});
ok(p.url().endsWith('/admin/'), 'recovery code works once');

// public host
const pub = await (await ctx.newPage()).goto(`${PUBLIC}/admin/login/`);
ok(pub.status() === 404, 'public host does not serve /admin');
ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await b.close();
