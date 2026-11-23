/**
 * Simulates real visitors on the public site, then checks the events landed and the admin reports render.
 *   ADMIN_USER=analyst1 ADMIN_PASS='<temporary password>' node tests/analytics.e2e.mjs
 */
import { createRequire } from 'node:module';
import { authenticator } from 'otplib';
import postgres from 'postgres';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const PUBLIC = 'http://localhost:3000', BASE = 'http://admin.localhost:3000';
const sql = postgres(process.env.DATABASE_URL || 'postgres://bynh:bynh_dev_pw@127.0.0.1:5432/bynh');
const ok = (c, m) => { if (!c) { console.error('✖ ' + m); process.exitCode = 1; } else console.log('✓ ' + m); };
const shots = process.env.SHOTS; let n = 0;
const [{ max: startId }] = await sql`select coalesce(max(id),0)::int max from events`;

const b = await chromium.launch();
const visitors = [
  { ...devices['iPhone 13'] },
  { ...devices['Pixel 7'] },
  { viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' },
  { viewport: { width: 1280, height: 800 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15' },
];
const posts = await sql`select slug from posts where status = 'published' order by published_at desc limit 6`;
for (const [i, v] of visitors.entries()) {
  const ctx = await b.newContext(v);
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.fulfill({ status: 204, body: '' })); // don't leave the site
  const p = await ctx.newPage();
  await p.goto(`${PUBLIC}/?utm_source=${i % 2 ? 'instagram' : 'google'}&utm_medium=cpc&utm_campaign=launch`, { waitUntil: 'networkidle' });
  await p.goto(`${PUBLIC}/${encodeURIComponent('المدونة')}/`, { waitUntil: 'networkidle' });
  for (const post of posts.slice(i, i + 2)) {
    await p.goto(`${PUBLIC}/${encodeURIComponent(post.slug)}/`, { waitUntil: 'networkidle' });
    const steps = i % 2 ? 4 : 30; // half read to the end
    for (let k = 0; k < steps; k++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(60); }
    await p.waitForTimeout(400);
  }
  if (i !== 3) { await p.click('a[href*="go.link"] >> nth=0').catch(() => {}); await p.waitForTimeout(300); }
  await p.click('a[href="/about-us/"] >> nth=0').catch(() => {}); await p.waitForLoadState('networkidle'); // in-site link → exit beacon
  if (i === 0) {
    await p.goto(`${PUBLIC}/${encodeURIComponent('التسجيل')}/`, { waitUntil: 'networkidle' });
    await p.fill('#f-name', 'زائر تجريبي'); await p.fill('#f-email', 'test@example.com'); await p.fill('#f-phone', '0500000000');
    await p.selectOption('#f-pkg', { index: 1 }); await p.click('#regForm button[type=submit]'); await p.waitForSelector('#regDone:not([hidden])');
  }
  await p.goto(`${PUBLIC}/no-such-page-${i}/`, { waitUntil: 'networkidle' });
  await p.goto(`${PUBLIC}/about-us/`, { waitUntil: 'networkidle' }); // pagehide of 404 + one more view
  await ctx.close(); // flushes engage/read beacons via pagehide
}
await new Promise((r) => setTimeout(r, 1500));
const ev = await sql`select type, count(*)::int n, count(distinct visitor)::int v from events where id > ${startId} group by type order by type`;
const by = Object.fromEntries(ev.map((e) => [e.type, e]));
console.log(ev.map((e) => `${e.type}:${e.n}`).join(' '));
ok(by.pageview?.n >= 20 && by.pageview.v === 4, 'pageviews recorded, 4 distinct visitors');
ok(by.read?.n >= 4, 'reading depth recorded for articles');
ok(by.engage?.n >= 1, 'engaged time recorded (exit beacons; headless drops some on navigation)');
ok(by.click?.n >= 3, 'app-download clicks recorded');
ok(by.notfound?.n === 4, '404s recorded separately from pageviews');
ok(by.form?.n === 1, 'registration form conversion recorded');
const [lead] = await sql`select count(*)::int n from leads where data->>'email' = 'test@example.com'`;
ok(lead.n >= 1, 'registration stored in leads');
const [raw] = await sql`select count(*)::int n from events where id > ${startId} and (visitor ~ '\\.' or visitor ~ ':')`;
ok(raw.n === 0, 'no raw IPs stored');
const bot = await fetch(`${PUBLIC}/api/collect/`, { method: 'POST', headers: { 'user-agent': 'Googlebot/2.1' }, body: JSON.stringify({ p: '/', s: 'x', e: [{ t: 'pageview' }] }) });
const [after] = await sql`select count(*)::int n from events where id > ${startId}`;
ok(bot.status === 204 && after.n === ev.reduce((a, e) => a + e.n, 0), 'bots ignored');

// admin reports
if (process.env.ADMIN_USER) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/admin/login/`);
  await p.fill('#u', process.env.ADMIN_USER); await p.fill('#p', process.env.ADMIN_PASS); await p.click('button[type=submit]');
  await p.waitForURL(/setup-2fa/);
  const secret = (await p.textContent('.secret')).replace(/\s/g, '');
  await p.fill('#c', authenticator.generate(secret)); await p.click('button[type=submit]');
  await p.waitForSelector('.codes'); await p.click('text=متابعة إلى لوحة التحكم'); await p.waitForURL(/account/);
  const NP = 'Bayyen#Strong-Pass-2026';
  await p.fill('#cur', process.env.ADMIN_PASS); await p.fill('#nw', NP); await p.fill('#cf', NP); await p.click('form:has(#nw) button[type=submit]'); await p.waitForSelector('.msg.ok');
  for (const [path, name] of [['/admin/', 'overview'], ['/admin/analytics/?range=7', 'traffic'], ['/admin/analytics/blog/?range=7', 'blog'], ['/admin/analytics/clicks/?range=7', 'clicks'], ['/admin/funnels/?range=7', 'funnels'], ['/admin/analytics/404/?range=7', '404'], ['/admin/leads/', 'leads']]) {
    const r = await p.goto(BASE + path, { waitUntil: 'networkidle' });
    ok(r.status() === 200, `report ${name} renders`);
    if (name === 'traffic') { const svg = await p.$('.chart svg'); const bx = await svg.boundingBox(); await p.mouse.move(bx.x + bx.width * 0.1, bx.y + bx.height / 2); await p.waitForTimeout(200); ok(await p.isVisible('.chart .tip'), 'chart tooltip on hover'); }
    if (shots) await p.screenshot({ path: `${shots}/${String(++n).padStart(2, '0')}-${name}.png`, fullPage: true });
  }
  ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
}
await b.close(); await sql.end();
