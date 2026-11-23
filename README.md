# bynh.sa — Next.js static site

The new bynh.sa: a Next.js 15 app exported to plain static files (`next build` → `out/`) and served by nginx.
WordPress stays only as the blog's content back office (headless, at `cms.bynh.sa`).

```
            build time (scripts/deploy.sh)                       request time
WordPress ──REST API──▶ next build ──▶ out/ (static HTML) ──▶ nginx ──▶ visitor
cms.bynh.sa/wp-json                                            │
cms.bynh.sa/wp-content  ◀──────────── proxied by nginx ────────┘ (post images)
```

## What is in the build

| URL (unchanged from today) | Source |
|---|---|
| `/` | `app/page.tsx` → `components/pages/HomePage.tsx` (latest 3 posts from WordPress) |
| `/about-us/`, `/contact-us/` | `app/about-us`, `app/contact-us` |
| `/استشارات-قانونية/`, `/خدمات-قانونية/`, `/طلب-تسجيل-محامي/`, `/الأسئلة-الشائعة/`, `/التسجيل/` | `app/[slug]/page.tsx` (static map) |
| `/المدونة/`, `/المدونة/page/N/` | `components/BlogList.tsx` — all posts, 9 per page |
| `/<post-slug>/` (all 456 posts, at the site root like WordPress) | `app/[slug]/page.tsx` → `components/Article.tsx` |
| `/privacy-policy/`, `/terms-and-conditions/`, `/service-provider-agreement/` | `content/legal/*.html` (verbatim legal text) |
| `/sitemap.xml`, `/robots.txt`, `/blog-index.json` | generated at build (index feeds blog search + tag filter) |

SEO titles/descriptions of the marketing pages are carried over from Yoast (`lib/seo.ts`); posts use their own
`yoast_head_json` from the API, with canonical URLs forced to `https://bynh.sa`.

All copy is verbatim from the current site. Pages removed on purpose (redirected in nginx): `/training/` (empty),
`/landing/` (old copy of the home page — its 4 extra reviews moved to the new home page), `/soon/`, `/my-account/`, `/checkout/`.

## Develop

```bash
cp .env.example .env.local      # set WP_API_URL and WP_MEDIA_ORIGIN (see comments)
npm install
npm run dev                     # http://localhost:3000
npm run build                   # writes ./out
npx serve out                   # preview the static export
```

Node 20+ (tested on Node 22). Interactivity (menu, FAQ, form, scroll motion) lives in `components/Behaviors.tsx`;
the blog search is `components/BlogFilter.tsx`. Design tokens and styles: `app/globals.css`.

## Deploy on the nginx server

1. Put the repo at e.g. `/opt/bynh-web`, create `.env.production` from `.env.example`.
2. Install the site config: `deploy/nginx.conf` → `/etc/nginx/sites-available/bynh.sa` (UTF-8), enable it, `nginx -t && systemctl reload nginx`.
3. First release: `scripts/deploy.sh` (builds, copies to `/var/www/bynh/releases/<time>`, flips `/var/www/bynh/current`).
   Roll back by pointing `current` at an older release.

### Keeping the blog fresh

New or edited posts appear after a rebuild (~1–2 min). Pick one:
- **Cron (no WordPress changes):** `*/10 * * * * /opt/bynh-web/scripts/rebuild-if-changed.sh` — rebuilds only when the post count or latest modified date changed.
- **Instant:** a publish hook in WordPress (e.g. the "WP Webhooks" plugin, or a small `save_post` snippet) that calls an endpoint on the server which runs `scripts/rebuild-if-changed.sh`.

## WordPress switch-over checklist

1. Move WordPress to `cms.bynh.sa` (Settings → WordPress Address & Site Address), keep the same database.
2. On the CMS host, redirect its public front end to `https://bynh.sa` (allow `/wp-admin`, `/wp-login.php`, `/wp-json`, `/wp-content`), and set it to *discourage search engines*.
3. Set `WP_API_URL=https://cms.bynh.sa/wp-json/wp/v2`, deploy, point `bynh.sa` DNS at the nginx server.
4. Verify: a few old post URLs, `/wp-content/uploads/...` images, `/sitemap.xml` (submit it in Search Console).

## Open items

- Registration form (`/التسجيل/`) validates and confirms on the page; it needs a destination (email/CRM/API) — it was an Enfold form before.
- Lawyer sign-up keeps pointing to `https://lawyers.bynh.app/register/step-one`; app download to `https://bynh.go.link/1mPkZ`.
- Hero avatars are licensed stock photos (Unsplash License) used decoratively; replace with real customer/lawyer photos when available.
