#!/usr/bin/env bash
# Nightly backup (cron: 15 3 * * * /opt/bynh-web/scripts/backup.sh): database dump + uploads, keeps 14 days.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.production; set +a
DEST="${BACKUP_DIR:-/var/backups/bynh}"; STAMP="$(date +%F)"
mkdir -p "$DEST"
pg_dump --format=custom --no-owner "$DATABASE_URL" > "$DEST/db-$STAMP.dump"
tar -C "${UPLOAD_DIR:-/var/lib/bynh/uploads}" -czf "$DEST/uploads-$STAMP.tgz" --newer-mtime="$(date -d '-2 days' +%F)" . 2>/dev/null || true
find "$DEST" -type f -mtime +14 -delete
echo "backup ok: $DEST/db-$STAMP.dump"
