# Handoff — bynh.sa rebuild (read this first)

## Project
بيّنه (bynh.sa), a Saudi legal-consultation app's website. Goal: replace WordPress with one Next.js 15.5 app (Node server) +
PostgreSQL behind nginx, **without losing SEO rankings**, plus a secure admin dashboard at `admin.bynh.sa` for the blog and analytics.
Repo: https://github.com/AmrHamdy00/bynh-webapp (branch `main`). The org repo `Baeynh-app/new-bynh-webapp` is NOT usable (Claude GitHub App not installed there).

## User rules
- Design: modelled on the Ostack template (ostack.webflow.io) with Bynh tokens — navy `#083A51`, IBM Plex Sans Arabic, RTL. Never animate Arabic per letter; no Lenis.
- Copy is verbatim from bynh.sa — never invent marketing copy. Every old bynh.sa URL must keep working at its original address.
- External apps stay external: `bynh.go.link/1mPkZ` (app), `client.bynh.app`, `lawyers.bynh.app/register/step-one`, `wa.me/966920033469`.
- Short replies, results over explanations; the user sometimes writes in Egyptian Arabic. Security "to the max level". Don't push/PR unless asked (pushing to `main` of the repo above was requested and is the norm now).

## State (all done, tested, pushed)
- **Public site** reads posts from PostgreSQL (cached rendering, `revalidateTag('posts')` on publish). Yoast-identical metadata + JSON-LD,
  Yoast sitemap URLs (`/sitemap_index.xml`, `/post-sitemap.xml`, `/page-sitemap.xml`), `/feed/`, legacy WP URLs in `middleware.ts`.
- **SEO parity**: `seo/baseline.json` = snapshot of the live WordPress (489 URLs). `npm run seo:compare` → 0 blocking, 20 intended warnings.
- **Importer** `npm run import:wp`: 456 posts, Yoast SEO, page SEO (17 WP pages), 2177 media records, 33,262 files (5.4 GB) to `UPLOAD_DIR`
  at identical `/wp-content/uploads/...` paths. 14 files 404 on WordPress itself (already broken). Must run while WordPress is live.
- **Admin** (`app/admin`, only on `admin.*` host): argon2id + mandatory TOTP + recovery codes, hashed sessions, lockouts, nonce CSP, roles
  (admin/editor/author), audit log, users page. Posts (Tiptap 3 editor + HTML mode, sanitize-html allow-list, untouched imported HTML kept
  byte-for-byte, auto 301 on slug change/trash, scheduling, revisions, signed previews `/preview-draft/<id>/?t=`), media library (sharp re-encode),
  redirects, page SEO, leads (`/التسجيل/` form → `leads`, CSV export).
- **Analytics**: cookieless tracker `components/Tracker.tsx` → `/api/collect/` → `events`; reports: traffic, blog reading, clicks, 404s, funnels.
- **Deploy files**: `deploy/nginx.conf` (proxy + stale cache, uploads from disk), `deploy/bynh-web.service`, `scripts/deploy.sh`, `scripts/backup.sh`,
  `docker-compose.yml` (local DB). README has local + server steps. `npm audit --omit=dev` = 0 vulnerabilities.
- **Tests** (need running server + fresh account each, see README): `tests/admin-auth.e2e.mjs` (20 ✓), `tests/admin-content.e2e.mjs` (13 ✓),
  `tests/analytics.e2e.mjs` (18 ✓).

## Recreating the dev environment in a cloud session
Nothing outside git survives (DB, media). In a fresh container:
```bash
# PostgreSQL 16 is preinstalled as binaries:
PGD=/home/user/pgdata; mkdir -p $PGD && chown postgres $PGD
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D $PGD -A scram-sha-256 --pwfile=<(echo devsuperpass) -E UTF8 --locale=C.UTF-8"
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D $PGD -l $PGD/log -o '-c listen_addresses=127.0.0.1' start"
PGPASSWORD=devsuperpass psql -h 127.0.0.1 -U postgres -c "create role bynh login password 'bynh_dev_pw'"
PGPASSWORD=devsuperpass psql -h 127.0.0.1 -U postgres -c "create database bynh owner bynh"
cp .env.example .env.local   # APP_SECRET=$(openssl rand -base64 48), PUBLIC_ORIGIN=http://localhost:3000
npm install && npm run db:migrate
NODE_USE_ENV_PROXY=1 npm run import:wp -- --no-download   # records only (fast); drop the flag to fetch 5.4 GB of media (~25 min, run in background)
npm run build && npm start   # dashboard: http://admin.localhost:3000 ; npm run admin:create -- <user> "<name>" admin
```
Gotchas learned: Node needs `NODE_USE_ENV_PROXY=1` to reach bynh.sa through the container proxy; don't use `redirect()` inside server actions
(behind proxies Next fetches the target over HTTP) — actions return `{ go }` and the client navigates; browsers send CRLF in form fields;
middleware and routes share caches only via `globalThis`; headless Chromium drops exit beacons (tracker also sends read milestones).

## Open items
1. Server go-live (user's server): run README "Deploy" steps, `nginx -t`, import media on the server, DNS switch, Search Console sitemap.
2. Google Search Console integration in the dashboard (needs a service account / access from the user).
3. Countries in analytics need nginx GeoIP (`X-Country-Code` header).
4. Real customer photos and an official logo SVG (hero avatars are stock; logo is `public/img/mark.png`).
5. The user said they have "many more requirements" — ask for them.
