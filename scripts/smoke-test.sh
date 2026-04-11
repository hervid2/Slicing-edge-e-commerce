#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Slicing Edge — Staging smoke test
#
# Usage:
#   bash scripts/smoke-test.sh
#
# Environment variables:
#   API_URL   base URL of the Fastify API  (default: http://localhost:3001)
#   WEB_URL   base URL of the Next.js app  (default: http://localhost:3000)
#
# Exit code:
#   0  all checks passed
#   1  one or more checks failed
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

API_URL="${API_URL:-http://localhost:3001}"
WEB_URL="${WEB_URL:-http://localhost:3000}"

PASS=0
FAIL=0

# ── Helpers ───────────────────────────────────────────────────────────────────
green() { echo -e "\033[0;32m✅  $*\033[0m"; }
red()   { echo -e "\033[0;31m❌  $*\033[0m"; }

check() {
  local label="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local body_contains="${4:-}"

  response=$(curl -s -o /tmp/smoke_body -w "%{http_code}" \
    --max-time 15 \
    --retry 3 \
    --retry-delay 3 \
    -H "Accept: application/json" \
    "$url") || { red "$label — curl failed (connection/SSL error)  ($url)"; FAIL=$((FAIL + 1)); return; }

  if [[ "$response" != "$expected_status" ]]; then
    red "$label — expected HTTP $expected_status, got $response  ($url)"
    FAIL=$((FAIL + 1))
    return
  fi

  if [[ -n "$body_contains" ]]; then
    if ! grep -q "$body_contains" /tmp/smoke_body 2>/dev/null; then
      red "$label — HTTP $response but body missing \"$body_contains\"  ($url)"
      FAIL=$((FAIL + 1))
      return
    fi
  fi

  green "$label  ($url)"
  PASS=$((PASS + 1))
}

check_redirect() {
  local label="$1"
  local url="$2"

  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 15 \
    --retry 3 \
    --retry-delay 3 \
    -L \
    "$url") || { red "$label — curl failed (connection/SSL error)  ($url)"; FAIL=$((FAIL + 1)); return; }

  if [[ "$status" == "200" ]]; then
    green "$label  ($url)"
    PASS=$((PASS + 1))
  else
    red "$label — got HTTP $status after redirect  ($url)"
    FAIL=$((FAIL + 1))
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "🔪 Slicing Edge — Smoke Test"
echo "   API: $API_URL"
echo "   WEB: $WEB_URL"
echo "──────────────────────────────────────────────────────────────"

# ── API checks ────────────────────────────────────────────────────────────────
echo ""
echo "▶ API"
check "Health endpoint"               "$API_URL/api/health"               200 '"status":"ok"'
check "Products list (public)"        "$API_URL/api/products"              200 '"data"'
check "Categories list (public)"      "$API_URL/api/categories"            200
check "Product by slug (first item)"  "$API_URL/api/products/classic-chef-knife-8-inch" 200 '"slug"'
check "Auth — bad credentials → 401"  "$API_URL/api/auth/login"            401
check "Chatbot — no body → 400/422"   "$API_URL/api/chatbot"               405  # POST-only, GET = 405

# ── Web checks ────────────────────────────────────────────────────────────────
echo ""
echo "▶ WEB"
check         "Homepage"              "$WEB_URL/"              200
check         "Products page"         "$WEB_URL/products"      200
check         "About page"            "$WEB_URL/about"         200
check         "Cart page"             "$WEB_URL/cart"          200
check         "Login page"            "$WEB_URL/auth/login"    200
check         "Sitemap"               "$WEB_URL/sitemap.xml"   200
check         "Robots"                "$WEB_URL/robots.txt"    200
check_redirect "Product detail page"  "$WEB_URL/products/classic-chef-knife-8-inch"

# ── Security header checks ─────────────────────────────────────────────────────
echo ""
echo "▶ SECURITY HEADERS (web)"

x_frame=$(curl -s -I --max-time 10 "$WEB_URL/" | grep -i "x-frame-options" | tr -d '\r\n')
if echo "$x_frame" | grep -qi "DENY\|SAMEORIGIN"; then
  green "X-Frame-Options present: $x_frame"
  PASS=$((PASS + 1))
else
  red "X-Frame-Options missing or permissive"
  FAIL=$((FAIL + 1))
fi

hsts=$(curl -s -I --max-time 10 "$WEB_URL/" | grep -i "strict-transport-security" | tr -d '\r\n')
if [[ -n "$hsts" ]]; then
  green "HSTS present: $hsts"
  PASS=$((PASS + 1))
else
  red "Strict-Transport-Security header missing"
  FAIL=$((FAIL + 1))
fi

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────────────────────────────────────"
echo "  Results: ${PASS} passed, ${FAIL} failed"
echo "──────────────────────────────────────────────────────────────"

if [[ "$FAIL" -gt 0 ]]; then
  red "Smoke test FAILED — fix the issues above before promoting to production."
  exit 1
else
  green "All smoke tests passed."
  exit 0
fi
