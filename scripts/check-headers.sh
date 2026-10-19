#!/usr/bin/env bash
# Checks a running Primed instance for the security requirements in docs/SECURITY.md.
# Usage: scripts/check-headers.sh https://primed.dev-pfeffermond.de [--insecure]
# The probes for .env/.git look like an attack scan: ModSecurity + Fail2Ban (Plesk) may ban your IP.
# Run it from a throwaway connection (phone hotspot) or trust your IP in Fail2Ban for the duration of the check.
set -euo pipefail

BASE="${1:?Base URL required, e.g. https://primed.dev-pfeffermond.de}"
CURL=(curl -sS --max-time 15)
[[ "${2:-}" == "--insecure" ]] && CURL+=(-k)

fail=0
pass() { printf '  ok    %s\n' "$1"; }
bad() { printf '  FAIL  %s\n' "$1"; fail=1; }

check_header() { # url name expected-substring
  local value
  value=$("${CURL[@]}" -D - -o /dev/null "$1" 2>/dev/null | tr -d '\r' | grep -i "^$2:" | head -1 | cut -d' ' -f2- || true)
  if [[ -n "$value" && "$value" == *"$3"* ]]; then pass "$2 on $1"; else bad "$2 on $1 (got: ${value:-none})"; fi
}

check_status() { # url expected-status [method]
  local status
  status=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X "${3:-GET}" "$1" 2>/dev/null || true)
  if [[ "$status" == "$2" ]]; then pass "$1 → $2"; else bad "$1 → expected $2, got $status"; fi
}

echo "Page headers"
for h in "Strict-Transport-Security:max-age=31536000" "Content-Security-Policy:default-src 'none'" \
  "X-Content-Type-Options:nosniff" "X-Frame-Options:DENY" "Referrer-Policy:no-referrer" \
  "Permissions-Policy:camera=(self)" "Cross-Origin-Opener-Policy:same-origin" "Cache-Control:no-cache"; do
  check_header "$BASE/" "${h%%:*}" "${h#*:}"
done

echo "PWA"
check_header "$BASE/sw.js" "Cache-Control" "no-cache"
check_header "$BASE/sw.js" "Content-Type" "javascript"
check_header "$BASE/manifest.webmanifest" "Content-Type" "application/manifest+json"
check_header "$BASE/pwa/icon-192.png" "Content-Type" "image/png"
check_status "$BASE/pwa/missing.png" 404

echo "Static assets (must get headers from Apache, not only from nginx)"
asset=$("${CURL[@]}" "$BASE/" | grep -o '/assets/theme-init-[0-9a-f]\{8\}\.js' | head -1 || true)
if [[ -n "$asset" ]]; then
  for h in "Content-Security-Policy:default-src 'none'" "X-Content-Type-Options:nosniff" \
    "Cross-Origin-Resource-Policy:same-origin" "Cache-Control:immutable" "Content-Type:javascript"; do
    check_header "$BASE$asset" "${h%%:*}" "${h#*:}"
  done
else
  bad "theme-init script not referenced in index.html"
fi
check_status "$BASE/assets/missing-00000000.js" 404

echo "API"
check_status "$BASE/api/v1/health" 200
check_header "$BASE/api/v1/health" "Cache-Control" "no-store"
check_header "$BASE/api/v1/health" "Content-Type" "application/json"
check_status "$BASE/api/v1/auth/me" 401
check_status "$BASE/api/v1/auth/login" 403 POST   # no Origin → rejected
check_status "$BASE/api/v1/nope" 404

echo "Nothing private is reachable"
for path in .env .htaccess api/.htaccess api/../.env .git/config primed-app/.env bootstrap.php api/bootstrap.php composer.json api/composer.json; do
  status=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$BASE/$path" 2>/dev/null || true)
  if [[ "$status" == "000" || -z "$status" ]]; then
    bad "/$path: no connection (IP banned by Fail2Ban/ModSecurity? unban in Plesk or use another connection)"
    continue
  fi
  body=$("${CURL[@]}" "$BASE/$path" 2>/dev/null | head -c 4000 || true)
  if [[ "$status" == "403" || "$status" == "404" ]] || [[ "$body" == *'<div id="root">'* ]]; then
    pass "/$path not exposed ($status)"
  else
    bad "/$path exposed ($status)"
  fi
done

echo "HTTP → HTTPS"
http_url="${BASE/https:/http:}"
for path in / /api/v1/health; do
  status=$("${CURL[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' "$http_url$path" 2>/dev/null || true)
  if [[ "$status" == 30[18]\ https://* ]]; then pass "redirect $path ($status)"; else bad "no HTTPS redirect for $path ($status)"; fi
done

exit $fail
