#!/usr/bin/env bash
# Reseed mock data + run Playwright persona walkthroughs in headed mode,
# writing fresh screenshots to docs/demo-screenshots/.
#
# Usage:
#   bash scripts/demo-walkthrough.sh                 # headed (default)
#   HEADED=0 bash scripts/demo-walkthrough.sh        # headless (CI/sandbox)
#   BASE_URL=http://localhost:8080 bash scripts/demo-walkthrough.sh
#
# Requires: VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY in .env,
# python3 with playwright installed, and a running dev server.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL missing — is Lovable Cloud connected?}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?VITE_SUPABASE_PUBLISHABLE_KEY missing}"

BASE_URL="${BASE_URL:-http://localhost:8080}"
HEADED="${HEADED:-1}"

echo "▶ [1/2] Reseeding personas (Stanford / Northwind / Lumen)…"
curl -fsS -X POST \
  "${VITE_SUPABASE_URL}/functions/v1/seed-personas" \
  -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
  -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}' \
  | tee /tmp/seed-personas.log
echo

echo "▶ [2/2] Capturing walkthrough screenshots (HEADED=${HEADED}, BASE_URL=${BASE_URL})…"
HEADED="${HEADED}" BASE_URL="${BASE_URL}" \
  python3 docs/demo-screenshots/walkthrough.py

echo "✓ Done. Screenshots in docs/demo-screenshots/{student,pm,founder}/"