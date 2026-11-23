/**
 * End-to-end: blog management through the admin, checked on the public site.
 *   ADMIN_USER=editor1 ADMIN_PASS='<temporary password>' node tests/admin-content.e2e.mjs
 * (fresh account from `npm run admin:create -- editor1 "Editor" editor`)
 */
import { createRequire } from 'node:module';
import { authenticator } from 'otplib';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = 'http://admin.localhost:3000', PUBLIC = 'http://localhost:3000';
const USER = process.env.ADMIN_USER, PASS = process.env.ADMIN_PASS, NEWPASS = 'Bayyen#Strong-Pass-2026';
const shots = process.env.SHOTS; let n = 0;
const ok = (c, m) => { if (!c) { console.error('✖ ' + m); process.exitCode = 1; } else console.log('✓ ' + m); };
const enc = (p) => p.split('/').map(encodeURIComponent).join('/');
const get = (p) => fetch(PUBLIC + enc(p), { redirect: 'manual' });

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
const p = await ctx.newPage();
const errors = []; p.on('pageerror', (e) => errors.push(e.message));
p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'صورة اختبار' : undefined));
const snap = async (name) => shots && p.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png`, fullPage: false });

// sign in + enrol
await p.goto(`${BASE}/admin/login/`);
await p.fill('#u', USER); await p.fill('#p', PASS); await p.click('button[type=submit]');
await p.waitForURL(/setup-2fa/);
const secret = (await p.textContent('.secret')).replace(/\s/g, '');
await p.fill('#c', authenticator.generate(secret)); await p.click('button[type=submit]');
await p.waitForSelector('.codes'); await p.click('text=متابعة إلى لوحة التحكم'); await p.waitForURL(/account/);
await p.fill('#cur', PASS); await p.fill('#nw', NEWPASS); await p.fill('#cf', NEWPASS); await p.click('form:has(#nw) button[type=submit]');
await p.waitForSelector('.msg.ok');

// list
await p.goto(`${BASE}/admin/posts/`);
ok((await p.$$('.tbl tbody tr')).length === 30, 'posts list paginated (30 per page)');
await snap('posts');

// open an imported post and save without touching the body → body stays byte-identical
const first = await p.$eval('.tbl tbody tr a', (a) => a.getAttribute('href'));
await p.goto(BASE + first);
await p.waitForSelector('.prose-ed');
await snap('editor');
const slugOld = await p.inputValue('#sl');
const before = await (await get(`/${slugOld}/`)).text();
await p.click('.pside button[type=submit]'); await p.waitForSelector('.msg.ok');
await new Promise((r) => setTimeout(r, 500));
const after = await (await get(`/${slugOld}/`)).text();
const art = (h) => (h.match(/<article class="prose"[\s\S]*?<\/article>/) || [''])[0];
ok(art(before) && art(before) === art(after), 'saving an untouched imported post keeps its HTML identical');

// new post with uploaded cover
const png = '/tmp/bynh-e2e.png';
writeFileSync(png, await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#083A51' } }).png().toBuffer());
await p.goto(`${BASE}/admin/posts/new/`);
const title = `مقال اختبار ${Date.now() % 100000}`;
await p.fill('#t', title);
await p.click('.prose-ed'); await p.keyboard.type('هذه فقرة اختبار للمحرر. ');
await p.click('text=ع٢'); await p.keyboard.type('عنوان فرعي');
await p.fill('#ex', 'مقتطف المقال التجريبي');
await p.fill('#sd', 'وصف تجريبي للسيو بطول مناسب يشرح محتوى المقال بوضوح للقارئ ولمحركات البحث في المملكة العربية السعودية.');
await p.selectOption('#ps', 'published');
await p.click('text=اختيار صورة');
const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('.modal >> text=رفع صورة')]);
await chooser.setFiles(png);
await p.waitForSelector('.pside img');
await snap('new-post');
await p.click('.pside button[type=submit]');
await p.waitForURL(/\/admin\/posts\/\d+\/$/);
const slug = await p.inputValue('#sl');
let r = await get(`/${slug}/`);
const html = await r.text();
ok(r.status === 200 && html.includes(title), 'new post is live at its address');
ok(/<script type="application\/ld\+json">[^<]*"Article"/.test(html), 'new post has Article JSON-LD');
ok(html.includes('og:image') && html.includes('/wp-content/uploads/'), 'uploaded cover used as og:image');
const sm = await (await get('/post-sitemap.xml')).text();
ok(sm.includes(enc(`/${slug}/`)), 'new post listed in sitemap');

// rename the address → automatic 301 from the old one
await p.fill('#sl', `${slug}-جديد`);
await p.click('.pside button[type=submit]'); await p.waitForSelector('.msg.ok');
await new Promise((r2) => setTimeout(r2, 1500));
r = await get(`/${slug}/`);
ok(r.status === 301 && decodeURIComponent(r.headers.get('location')).endsWith(`/${slug}-جديد/`), 'old address 301 → new address');
ok((await get(`/${slug}-جديد/`)).status === 200, 'new address live');

// XSS attempt in the HTML editor is stripped
await p.click('text=HTML');
await p.fill('.ed-html', '<p>نص</p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a>');
await p.click('.pside button[type=submit]'); await p.waitForSelector('.msg.ok');
await new Promise((r2) => setTimeout(r2, 800));
const h2 = await (await get(`/${slug}-جديد/`)).text();
ok(!/onerror|javascript:alert|<script>alert/.test(art(h2)), 'script, event handlers and javascript: links stripped');

// trash → 301 to the blog
await p.goto(`${BASE}/admin/posts/?q=${encodeURIComponent(title)}`);
await p.check('.tbl tbody input[type=checkbox]');
await p.click('text=نقل المحدد إلى المحذوفات'); await p.waitForLoadState('networkidle');
await new Promise((r2) => setTimeout(r2, 1500));
r = await get(`/${slug}-جديد/`);
ok(r.status === 301 && decodeURIComponent(r.headers.get('location')).includes('/المدونة/'), 'trashed post 301 → blog');

// media page, redirects page
await p.goto(`${BASE}/admin/media/`); ok((await p.$$('.mgrid .mitem')).length > 10, 'media library lists files'); await snap('media');
await p.goto(`${BASE}/admin/redirects/`); ok(await p.isVisible(`text=/${slug}/`), 'auto redirects visible in manager'); await snap('redirects');
ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
await b.close();
