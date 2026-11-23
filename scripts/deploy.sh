#!/usr/bin/env bash
# Build the static site and switch nginx to it atomically.
#   - builds into ./out (fetches every post from the WordPress REST API)
#   - copies to /var/www/bynh/releases/<timestamp>
#   - points /var/www/bynh/current at it, keeps the last 5 releases for instant rollback
# Rollback: ln -sfn /var/www/bynh/releases/<older> /var/www/bynh/current
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT="${WEB_ROOT:-/var/www/bynh}"
STAMP="$(date +%Y%m%d-%H%M%S)"

cd "$APP_DIR"
[ -f .env.production ] && set -a && . ./.env.production && set +a

npm ci --no-audit --no-fund
npm run build

# sanity checks before going live
test -f out/index.html
test -f "out/المدونة/index.html"
POSTS=$(node -e "console.log(require('./out/blog-index.json').total)")
if [ "${POSTS:-0}" -lt 1 ]; then echo "No posts in build — aborting"; exit 1; fi
echo "Built ${POSTS} posts"

mkdir -p "$WEB_ROOT/releases"
cp -a out "$WEB_ROOT/releases/$STAMP"
ln -sfn "$WEB_ROOT/releases/$STAMP" "$WEB_ROOT/current.tmp"
mv -Tf "$WEB_ROOT/current.tmp" "$WEB_ROOT/current"

# keep the 5 newest releases
ls -1dt "$WEB_ROOT"/releases/*/ | tail -n +6 | xargs -r rm -rf --

echo "Live: $WEB_ROOT/releases/$STAMP"
