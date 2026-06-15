#!/usr/bin/env bash
# One-shot: reseed all demo personas + the super-admin, then verify every
# judge login authenticates against Lovable Cloud (Supabase Auth).
#
# Usage:
#   bash scripts/seed-and-verify-demo.sh
#   npm run demo:seed
#
# Requires VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY in .env.
# Exits non-zero if any account fails to authenticate.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then set -a; . ./.env; set +a; fi

: "${VITE_SUPABASE_URL:?VITE_SUPABASE_URL missing — is Lovable Cloud connected?}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?VITE_SUPABASE_PUBLISHABLE_KEY missing}"

APIKEY="$VITE_SUPABASE_PUBLISHABLE_KEY"
URL="$VITE_SUPABASE_URL"

# Judge accounts — keep in sync with README.md "Demo accounts" table.
#   email|password|persona
ACCOUNTS=(
  "student.demo@chiefofstaff.app|Demo!2026|Member · Stanford CS Cohort (free trialing)"
  "pm.demo@chiefofstaff.app|Demo!2026|Manager · Northwind Product (pro)"
  "founder.demo@chiefofstaff.app|Demo!2026|Admin · Lumen Robotics (enterprise)"
  "simonnjenganjuguna@gmail.com|aqC!xeF2|Super Admin · cross-org platform operator"
)

invoke() {
  local fn="$1"
  echo "▶ $fn"
  curl -fsS -X POST "$URL/functions/v1/$fn" \
    -H "Authorization: Bearer $APIKEY" \
    -H "apikey: $APIKEY" \
    -H "Content-Type: application/json" \
    -d '{}' >/dev/null
  echo "  ✓ $fn ok"
}

echo "════════════════════════════════════════════════════════════"
echo "  [1/2] Reseeding demo data"
echo "════════════════════════════════════════════════════════════"
invoke seed-personas
invoke seed-super-admin

echo
echo "════════════════════════════════════════════════════════════"
echo "  [2/2] Verifying judge logins"
echo "════════════════════════════════════════════════════════════"

fail=0
for row in "${ACCOUNTS[@]}"; do
  IFS='|' read -r email password persona <<<"$row"
  body=$(printf '{"email":"%s","password":"%s"}' "$email" "$password")
  resp=$(curl -sS -o /tmp/auth-resp.json -w "%{http_code}" \
    -X POST "$URL/auth/v1/token?grant_type=password" \
    -H "apikey: $APIKEY" \
    -H "Content-Type: application/json" \
    -d "$body")
  if [ "$resp" = "200" ]; then
    echo "  ✓ $email  — $persona"
  else
    echo "  ✗ $email  (HTTP $resp) — $persona"
    cat /tmp/auth-resp.json; echo
    fail=$((fail + 1))
  fi
done

echo
if [ "$fail" -eq 0 ]; then
  echo "✓ All ${#ACCOUNTS[@]} judge accounts authenticate. Demo is ready."
else
  echo "✗ $fail account(s) failed to authenticate." >&2
  exit 1
fi