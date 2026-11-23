#!/usr/bin/env bash
# Vercel build command (vercel.json). Safe to run on every deploy:
#   1. apply database migrations
#   2. first deploy only (empty database): import posts + SEO from the live WordPress (read-only, media stays on bynh.sa)
#   3. first deploy only: create the bootstrap admin from ADMIN_BOOTSTRAP_USER (temporary password printed in the build log;
#      first sign-in forces a new password + authenticator setup)
#   4. next build
set -euo pipefail
npx drizzle-kit migrate
COUNT=$(npx tsx scripts/db-count.ts posts)
if [ "$COUNT" = "0" ]; then
  echo "Empty database → importing from ${WP_API_URL:-https://bynh.sa/wp-json/wp/v2} (records only)"
  npx tsx scripts/import-wp.ts --no-download
fi
if [ -n "${ADMIN_BOOTSTRAP_USER:-}" ]; then
  USERS=$(npx tsx scripts/db-count.ts users)
  if [ "$USERS" = "0" ]; then npx tsx scripts/create-admin.ts "$ADMIN_BOOTSTRAP_USER" "${ADMIN_BOOTSTRAP_NAME:-Admin}" admin; fi
fi
npx next build
