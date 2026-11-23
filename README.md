# bynh.sa — website + admin dashboard

One Next.js 15 app on Node, PostgreSQL, behind nginx. It replaces WordPress completely.

```
visitor ──▶ nginx ──▶ Next.js (127.0.0.1:3000) ──▶ PostgreSQL
            │  bynh.sa        public pages: pre-rendered + cached HTML (fast as static, same URLs as WordPress)
            │  admin.bynh.sa  dashboard: posts, media, SEO, redirects, analytics, funnels, leads, users
            └─ /wp-content/uploads/ served from disk (the 33k files imported from WordPress, same paths)
```

## Run it locally

```bash
docker compose up -d db                      # PostgreSQL 16 on 127.0.0.1:5432 (or use your own)
cp .env.example .env.local                   # then set APP_SECRET:  openssl rand -base64 48
                                             #           PUBLIC_ORIGIN=http://localhost:3000
npm install
npm run db:migrate                           # create tables
npm run import:wp                            # copy posts, SEO, pages SEO and all media from bynh.sa (~5 GB, re-runnable)
npm run admin:create -- yourname "Your Name" admin   # prints a one-time password
npm run build && npm start                   # production mode (or: npm run dev)
```

- Public site: http://localhost:3000
- Dashboard: **http://admin.localhost:3000** (browsers resolve `*.localhost` to your machine). First sign-in asks you to scan a QR code with an
  authenticator app (Google/Microsoft Authenticator, Authy…), shows 10 recovery codes once, then asks for a new password.

## Prove SEO is preserved (run before going live)

```bash
npm run seo:snapshot -- --base https://bynh.sa --out seo/baseline.json          # what Google sees today (already in the repo)
npm run seo:snapshot -- --base http://localhost:3000 --urls seo/baseline.json --out seo/local.json
npm run seo:compare -- seo/baseline.json seo/local.json --html seo/report.html  # exit code 1 if anything blocking
```

Checks every old URL (489: posts, pages, blog pages, tag/category/author archives, feed, sitemaps): status, title, description,
canonical, robots, Open Graph, article dates, h1 and JSON-LD types. Current result: **0 blocking differences**; the 20 warnings are
intended (redesigned h1s on a few pages, /training/ → 301, article dates Yoast didn't print).

What keeps rankings:
- every post at the same `/<arabic-slug>/`, same publish date, Yoast title/description/canonical/robots/OG/Twitter and the original
  Yoast JSON-LD graph (regenerated in the same shape once a post is edited);
- `/sitemap_index.xml`, `/post-sitemap.xml`, `/page-sitemap.xml` (with images) and `/feed/` at their WordPress addresses;
- tag/category/author archives (all `noindex` on WordPress) → 301 to the blog; `/?s=` → blog search; `/?p=ID` → the post;
  `/wp-admin`, `*.php` → 410; dropped pages → 301 (managed in the dashboard under «التحويلات»);
- changing a live post's address, or deleting it, adds a 301 automatically; the 404 report lists broken URLs to redirect.

## End-to-end tests (need a running server and a fresh account each)

```bash
npm run admin:create -- t1 "Test" admin    && ADMIN_USER=t1 ADMIN_PASS='…' node tests/admin-auth.e2e.mjs
npm run admin:create -- t2 "Test" editor   && ADMIN_USER=t2 ADMIN_PASS='…' node tests/admin-content.e2e.mjs
npm run admin:create -- t3 "Test" editor   && ADMIN_USER=t3 ADMIN_PASS='…' node tests/analytics.e2e.mjs
```
(Repeated failed logins trip the rate limiter by design; locally clear it with `delete from login_attempts`.)

## Security

| Layer | What |
|---|---|
| Sign-in | argon2id passwords (12+ chars, policy), **mandatory authenticator app** (TOTP, replay-proof), 10 hashed single-use recovery codes |
| Sessions | 256-bit tokens, only SHA-256 stored; `__Host-` HttpOnly Secure SameSite=Strict cookie on admin.bynh.sa only; 30 min idle / 12 h max; new token after each step; password change signs out everywhere |
| Brute force | per-IP and per-account limits, escalating account lock, nginx `limit_req` on the login page, uniform error messages and timing |
| Isolation | admin only on `admin.bynh.sa` (404 on the public host), noindex, `frame-ancestors 'none'`, strict nonce-based CSP, optional IP allow-list (env or nginx) |
| Roles | admin (everything) · editor (all content, SEO, redirects, leads) · author (own drafts only) |
| Content | every saved article body passes an HTML allow-list (no scripts, event handlers, `javascript:` links); untouched imported HTML is kept byte-for-byte |
| Uploads | type detected from bytes, images decoded and re-encoded (EXIF/GPS and hidden payloads dropped), SVG/HTML refused, 10 MB cap, nginx never executes anything in uploads |
| Forms/API | same-origin checks (CSRF), honeypot + rate limits on the registration form, CSV export protected against formula injection |
| Audit | every sign-in, failure, lock, publish, delete, role change, export is logged with time and IP («سجل النشاط») |
| Secrets | `APP_SECRET` encrypts authenticator secrets (AES-256-GCM); app refuses to start in production without it |

## Analytics (first-party, no cookies)

`components/Tracker.tsx` (~2 KB) → `/api/collect/` → `events` table. Pageviews, sources/UTM, devices, countries (if nginx passes
GeoIP), reading depth and completion per article, engaged time, clicks (app download, WhatsApp, client login, lawyer sign-up, phone,
outbound), registration conversions, 404s, and funnels. Visitors are counted with a daily-rotating salted hash — no cookie, no raw IP
stored, Do-Not-Track/GPC honoured.

## Deploy on the server

1. Install Node 22, PostgreSQL 16, nginx. Create user `bynh`, clone to `/opt/bynh-web`, uploads dir `/var/lib/bynh/uploads`
   (copy `storage/uploads/` there, or run `npm run import:wp` on the server with `UPLOAD_DIR` set).
2. `.env.production` from `.env.example` (`TRUST_PROXY=1`, real `APP_SECRET`, `DATABASE_URL`, `UPLOAD_DIR`).
3. `npm ci && npm run db:migrate && npm run build`, then `deploy/bynh-web.service` → `/etc/systemd/system/`, `systemctl enable --now bynh-web`.
4. `deploy/nginx.conf` → nginx sites, certificate for `bynh.sa`, `www.bynh.sa`, `admin.bynh.sa`; `nginx -t && systemctl reload nginx`.
5. `npm run admin:create -- <you> "<name>" admin`, sign in at https://admin.bynh.sa and enrol your authenticator.
6. Run the SEO compare against the server before switching DNS; afterwards submit `/sitemap_index.xml` in Search Console and watch
   «روابط مكسورة» daily for a few weeks.
7. Updates: `scripts/deploy.sh`. Backups: `scripts/backup.sh` nightly (database + uploads).

## Staging copy on Vercel (test before going live, without touching bynh.sa)

Runs on `*.vercel.app` addresses only: bynh.sa is never added to Vercel, DNS is untouched, WordPress is only read (public API).
`STAGING=1` makes every page `noindex` and `robots.txt` block all crawlers; canonical URLs keep pointing to bynh.sa.
Images are not copied: `MEDIA_FALLBACK_ORIGIN=https://bynh.sa` sends `/wp-content/uploads/…` requests to the live site.

1. vercel.com → **Add New → Project** → import the GitHub repo `AmrHamdy00/bynh-webapp` (framework: Next.js; `vercel.json` sets the build).
2. Project → **Storage**: create a Postgres database (Neon or Supabase, region Frankfurt, matches `fra1`) and a **Blob** store, both connected
   to the project. Their variables are read as-is (`DATABASE_URL`/`POSTGRES_URL`, `…_UNPOOLED`/`POSTGRES_URL_NON_POOLING`, `BLOB_READ_WRITE_TOKEN`).
3. Project → **Settings → Environment Variables** (Production):
   `STAGING=1` · `APP_SECRET=<openssl rand -base64 48>` · `SITE_URL=https://bynh.sa` · `PUBLIC_ORIGIN=https://<project>.vercel.app` ·
   `MEDIA_FALLBACK_ORIGIN=https://bynh.sa` · `ADMIN_HOST=<project>-admin.vercel.app` · `TRUST_PROXY=1` · `ADMIN_BOOTSTRAP_USER=<username>` ·
   `ADMIN_BOOTSTRAP_NAME=<name>`
4. Project → **Settings → Domains**: add a second free domain `<project>-admin.vercel.app` (the dashboard host).
5. **Deploy.** The first build migrates the empty database, imports all posts + SEO from bynh.sa and creates the bootstrap admin —
   its temporary password is printed in the build log (sign-in forces a new password + authenticator). Then remove `ADMIN_BOOTSTRAP_*`.
6. Optional: **Settings → Deployment Protection** to put the whole copy behind Vercel login or a password.

Limits of the staging copy: uploads ≤ 4.5 MB (Vercel request limit), rate limits are per serverless instance, data lives in Frankfurt.

## Code map

| Path | What |
|---|---|
| `app/(site)/` | public pages (home, marketing pages, blog, posts at `/<slug>/`, signed draft preview) |
| `app/admin/` | dashboard (login, 2FA, posts, media, SEO, redirects, analytics, funnels, leads, users, audit) |
| `app/api/` | `collect` (analytics), `forms/register`, `admin/*` (media upload, logout, session, CSV) |
| `app/*.xml`, `app/feed` | Yoast-compatible sitemaps and RSS |
| `middleware.ts` | admin host isolation + CSP, WordPress legacy URLs, managed redirects |
| `lib/db/schema.ts` | database schema (Drizzle; migrations in `drizzle/`) |
| `lib/auth/` | passwords, TOTP, sessions, rate limits, audit |
| `lib/posts.ts`, `lib/post-meta.ts`, `lib/seo.ts` | public data + Yoast-identical metadata/JSON-LD |
| `lib/analytics.ts` | report queries |
| `scripts/import-wp.ts`, `scripts/seo/*` | WordPress import, SEO snapshot/compare |
