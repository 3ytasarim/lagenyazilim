#!/usr/bin/env bash
# Bir önceki (veya verilen) sürüme geri döner. Veritabanı migration'larını geri ALMAZ.
# Kullanım: scripts/rollback.sh [release-id]
set -Eeuo pipefail
BASE="${LAGEN_BASE:-/var/www/lagen}"
CUR="$(basename "$(readlink -f "$BASE/current")")"
if [ -n "${1:-}" ]; then TARGET="$1"; else TARGET="$(ls -1t "$BASE/releases" | grep -vx "$CUR" | head -1)"; fi
[ -n "$TARGET" ] && [ -d "$BASE/releases/$TARGET" ] || { echo "Geri dönülecek sürüm yok"; exit 1; }
echo "Etkin: $CUR → $TARGET"
ln -sfn "$BASE/releases/$TARGET" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"
( cd "$BASE/current" && RELEASE_ID="$TARGET" pm2 reload ecosystem.config.cjs --update-env )
sleep 3
curl -fsS "http://127.0.0.1:${PORT:-3490}/api/health/" && echo
