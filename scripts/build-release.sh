#!/usr/bin/env bash
# Builds an upload-ready release in build/release-<version>-<commit>/ (docs/DEPLOYMENT.md, "Jedes Release"):
#   httpdocs/     → contents go to the web root (frontend build + api/index.php + api/.htaccess)
#   primed-app/   → goes next to httpdocs/ (API code, production autoloader, empty var/log/; .env stays on the server)
#   migrations/   → for phpMyAdmin only, never uploaded
# Usage: scripts/build-release.sh [--allow-dirty]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" != "--allow-dirty" && -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean; commit first (or pass --allow-dirty for a test build)." >&2
  exit 1
fi

VERSION=$(sed -n 's/^  "version": "\(.*\)",$/\1/p' frontend/package.json)
COMMIT=$(git rev-parse --short HEAD)
OUT="build/release-$VERSION-$COMMIT"
rm -rf "$OUT"
mkdir -p "$OUT/httpdocs/api" "$OUT/primed-app/var/log" "$OUT/migrations"

echo "Frontend build"
# shellcheck disable=SC1091
[[ -s "$HOME/.nvm/nvm.sh" ]] && source "$HOME/.nvm/nvm.sh" >/dev/null && nvm use 22 >/dev/null
(cd frontend && npm run build >/dev/null)
cp -R frontend/dist/. "$OUT/httpdocs/"

echo "API (production autoloader, no dev dependencies)"
cp api/public/index.php api/public/.htaccess "$OUT/httpdocs/api/"
cp -R api/src api/resources api/bootstrap.php api/composer.json api/composer.lock "$OUT/primed-app/"
# CLI for user admin only; bin/migrate.php stays local (migrations run via phpMyAdmin, the app DB user has no DDL rights).
mkdir -p "$OUT/primed-app/bin"
cp api/bin/cli-bootstrap.php api/bin/user-*.php "$OUT/primed-app/bin/"
composer install --working-dir="$OUT/primed-app" --no-dev --optimize-autoloader --classmap-authoritative \
  --no-interaction --no-progress --quiet
rm "$OUT/primed-app/composer.json" "$OUT/primed-app/composer.lock"
cp api/migrations/*.sql "$OUT/migrations/"

echo "Permissions (files 644, directories 755)"
find "$OUT" -type d -exec chmod 755 {} +
find "$OUT" -type f -exec chmod 644 {} +

echo "Checks"
fail=0
bad() { printf '  FAIL  %s\n' "$1"; fail=1; }
for f in index.html .htaccess sw.js manifest.webmanifest pwa/icon-192.png api/index.php api/.htaccess; do
  [[ -f "$OUT/httpdocs/$f" ]] || bad "httpdocs/$f missing"
done
ls "$OUT/httpdocs/assets/" | grep -q '^theme-init-[0-9a-f]\{8\}\.js$' || bad "theme-init script missing"
[[ "$(find "$OUT/httpdocs/api" -type f | wc -l | tr -d ' ')" == "2" ]] || bad "httpdocs/api must contain exactly index.php and .htaccess"
for f in bootstrap.php vendor/autoload.php bin/user-create.php resources/common-passwords.txt; do
  [[ -f "$OUT/primed-app/$f" ]] || bad "primed-app/$f missing"
done
[[ -d "$OUT/primed-app/vendor/phpunit" ]] && bad "dev dependencies in vendor/"
[[ -f "$OUT/primed-app/bin/migrate.php" ]] && bad "bin/migrate.php must not be deployed"
[[ -n "$(find "$OUT" -name '.env' -o -name '.env.*' -o -name '*.map' -o -name '.git*' -o -name '.DS_Store')" ]] \
  && bad "secrets, source maps or VCS/system files in the release"
[[ -n "$(find "$OUT/httpdocs" -name '*.php' ! -path '*/api/index.php')" ]] && bad "PHP files in the web root"
if grep -rIl --exclude-dir=vendor -E 'APP_KEY=[A-Za-z0-9+/]{20,}|DB_PASS=[^[:space:]]+' "$OUT" >/dev/null; then
  bad "possible secret values in the release"
fi

(cd "$OUT" && find httpdocs primed-app migrations -type f | sort | xargs shasum -a 256 > SHA256SUMS)
{
  echo "Primed $VERSION · commit $COMMIT · built $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "Upload: httpdocs/* → httpdocs/ (replace assets/ completely) · primed-app/* → primed-app/ (keep the server's .env and var/log/)"
  echo "Migrations in migrations/ via phpMyAdmin, in order, after a database backup; never upload them."
} > "$OUT/RELEASE.txt"

if [[ $fail -ne 0 ]]; then
  echo "Release checks failed." >&2
  exit 1
fi
echo "Release ready: $OUT"
