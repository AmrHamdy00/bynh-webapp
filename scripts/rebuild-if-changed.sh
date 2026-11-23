#!/usr/bin/env bash
# Rebuild only when WordPress content changed. Run from cron every 10 minutes:
#   */10 * * * * /opt/bynh-web/scripts/rebuild-if-changed.sh >> /var/log/bynh-rebuild.log 2>&1
# It compares the newest post's modified time and the post count with the last build.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"
[ -f .env.production ] && set -a && . ./.env.production && set +a
API="${WP_API_URL:-https://cms.bynh.sa/wp-json/wp/v2}"
STATE="$APP_DIR/.last-build-state"

# newest modification + total count (one small request)
HEAD=$(curl -fsS -D - -o /tmp/bynh-latest.json "$API/posts?per_page=1&orderby=modified&order=desc&_fields=id,modified" | tr -d '\r')
TOTAL=$(echo "$HEAD" | awk -F': ' 'tolower($1)=="x-wp-total"{print $2}')
MODIFIED=$(node -e "console.log(require('/tmp/bynh-latest.json')[0]?.modified||'')")
NOW="$TOTAL|$MODIFIED"

if [ -f "$STATE" ] && [ "$(cat "$STATE")" = "$NOW" ]; then
  exit 0
fi

# avoid overlapping builds
exec 9>/tmp/bynh-build.lock
flock -n 9 || { echo "build already running"; exit 0; }

echo "$(date -Is) content changed ($NOW) — rebuilding"
"$APP_DIR/scripts/deploy.sh"
echo "$NOW" > "$STATE"
