#!/usr/bin/env bash
# Deploy on the server: pull, install, migrate, build, restart, smoke-test.
#   sudo -u bynh /opt/bynh-web/scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.production; set +a

git pull --ff-only
npm ci --no-audit --no-fund
npm run db:migrate
npm run build
sudo systemctl restart bynh-web

for i in $(seq 1 30); do curl -fsS -o /dev/null http://127.0.0.1:3000/ && break; sleep 1; done
for p in / /المدونة/ /sitemap_index.xml /feed/; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: bynh.sa' "http://127.0.0.1:3000$(node -e "console.log(encodeURI('$p'))")")
  echo "$p → $code"; [ "$code" = 200 ] || { echo "smoke test failed"; exit 1; }
done
echo "deployed $(git rev-parse --short HEAD)"
