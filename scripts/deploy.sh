#!/usr/bin/env bash
# Lagen Yazılım — sürüm klasörlü (release) deploy.
#
# Dizin yapısı (LAGEN_BASE, varsayılan /var/www/lagen):
#   repo/            git önbelleği (ilk kurulumda: git clone --mirror veya normal clone)
#   releases/<id>/   her deploy ayrı klasör
#   shared/.env      üretim ortam değişkenleri (repoda YOK)
#   shared/storage/  medya + teklif ekleri (STORAGE_DIR bunu göstermeli) — deploy'da asla silinmez
#   backups/         deploy öncesi veritabanı yedekleri
#   current ->       etkin sürüm (sembolik bağlantı)
#
# Akış: ön kontroller → git fetch → kurulum → DB yedeği + migration → build → yeni sürümü ayrı portta sağlık kontrolü
#       → current'ı atomik değiştir → pm2 reload → canlı sağlık kontrolü → başarısızsa otomatik geri dönüş.
# Build veya ön sağlık kontrolü başarısız olursa çalışan sürüme hiç dokunulmaz.
#
# Kullanım: scripts/deploy.sh [dal]        (varsayılan: main)
set -Eeuo pipefail

BASE="${LAGEN_BASE:-/var/www/lagen}"
BRANCH="${1:-main}"
APP="${PM2_APP_NAME:-lagen-web}"
KEEP="${KEEP_RELEASES:-5}"
CHECK_PORT="${HEALTH_CHECK_PORT:-3499}"

log() { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
die() { printf '\033[1;31m[deploy] HATA:\033[0m %s\n' "$*" >&2; exit 1; }

# ---------- 1. Ön kontroller ----------
for cmd in git node npm pm2 curl pg_dump; do command -v "$cmd" >/dev/null || die "$cmd bulunamadı"; done
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || die "Node.js 22+ gerekli (mevcut: $(node -v))"
[ -f "$BASE/shared/.env" ] || die "$BASE/shared/.env yok"
[ -d "$BASE/repo/.git" ] || die "$BASE/repo bir git deposu değil (ilk kurulum: docs/deployment.md)"

set -a; # shellcheck disable=SC1091
. "$BASE/shared/.env"; set +a
for key in DATABASE_URL DATABASE_URL_DIRECT SESSION_SECRET NEXT_PUBLIC_SITE_URL STORAGE_DIR; do
  [ -n "${!key:-}" ] || die "shared/.env içinde $key eksik"
done
[ "${#SESSION_SECRET}" -ge 32 ] || die "SESSION_SECRET en az 32 karakter olmalı"
[ "${SITE_URL_ALLOW_INSECURE:-0}" != "1" ] || die "Üretimde SITE_URL_ALLOW_INSECURE=1 olamaz"
case "$STORAGE_DIR" in "$BASE/releases"*) die "STORAGE_DIR release klasörünün içinde olamaz";; esac
mkdir -p "$STORAGE_DIR/public" "$STORAGE_DIR/private" "$BASE/releases" "$BASE/backups" "$BASE/logs"

PORT="${PORT:-3490}"
# Port başka bir süreç tarafından kullanılıyorsa (bizim PM2 uygulamamız değilse) dur
if ss -ltnp 2>/dev/null | grep -q ":$PORT "; then
  pm2 jlist 2>/dev/null | grep -q "\"name\":\"$APP\"" || die "Port $PORT başka bir uygulama tarafından kullanılıyor"
fi
ss -ltn 2>/dev/null | grep -q ":$CHECK_PORT " && die "Sağlık kontrolü portu $CHECK_PORT dolu"
AVAIL_KB="$(df -Pk "$BASE" | awk 'NR==2{print $4}')"
[ "$AVAIL_KB" -gt 1500000 ] || die "Diskte en az 1.5 GB boş alan gerekli"

# ---------- 2. Kaynak ----------
log "git fetch ($BRANCH)"
git -C "$BASE/repo" fetch --prune origin
SHA="$(git -C "$BASE/repo" rev-parse --short "origin/$BRANCH")"
ID="$(date +%Y%m%d-%H%M%S)-$SHA"
REL="$BASE/releases/$ID"
PREV="$(readlink -f "$BASE/current" 2>/dev/null || true)"
mkdir -p "$REL"
git -C "$BASE/repo" archive "origin/$BRANCH" | tar -x -C "$REL"
ln -sfn "$BASE/shared/.env" "$REL/.env"
echo "$ID" > "$REL/RELEASE"
cleanup_failed() { log "Başarısız sürüm temizleniyor: $ID"; rm -rf "$REL"; }

# ---------- 3. Bağımlılıklar ----------
log "npm ci"
( cd "$REL" && npm ci --no-audit --no-fund ) || { cleanup_failed; die "npm ci başarısız"; }

# ---------- 4. Yedek + migration ----------
log "Veritabanı yedeği"
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL_DIRECT" --file="$BASE/backups/predeploy-$ID.dump" || { cleanup_failed; die "pg_dump başarısız — migration yapılmadı"; }
log "Migration (veri kaybettiren komut içeren migration ALLOW_DESTRUCTIVE=1 olmadan uygulanmaz)"
( cd "$REL" && npm run --silent db:migrate ) || { cleanup_failed; die "Migration başarısız — çalışan sürüm değişmedi"; }

# ---------- 5. Build ----------
log "Production build"
( cd "$REL" && RELEASE_ID="$ID" npm run build ) || { cleanup_failed; die "Build başarısız — çalışan sürüm değişmedi"; }

# ---------- 6. Yeni sürümü ayrı portta dene ----------
log "Ön sağlık kontrolü (127.0.0.1:$CHECK_PORT)"
( cd "$REL" && RELEASE_ID="$ID" NODE_ENV=production node node_modules/next/dist/bin/next start -H 127.0.0.1 -p "$CHECK_PORT" >"$BASE/logs/healthcheck-$ID.log" 2>&1 ) &
CHECK_PID=$!
ok=0
for _ in $(seq 1 30); do
  sleep 2
  if curl -fsS "http://127.0.0.1:$CHECK_PORT/api/health/" | grep -q '"ok":true' && curl -fsS -o /dev/null "http://127.0.0.1:$CHECK_PORT/"; then ok=1; break; fi
done
kill "$CHECK_PID" 2>/dev/null || true; wait "$CHECK_PID" 2>/dev/null || true
[ "$ok" = 1 ] || { cleanup_failed; die "Yeni sürüm sağlık kontrolünden geçmedi — çalışan sürüm değişmedi (log: logs/healthcheck-$ID.log)"; }

# ---------- 7. Geçiş ----------
log "current → $ID"
ln -sfn "$REL" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"
( cd "$BASE/current" && RELEASE_ID="$ID" pm2 startOrReload ecosystem.config.cjs --update-env ) || true

# ---------- 8. Canlı kontrol / geri dönüş ----------
live=0
for _ in $(seq 1 20); do
  sleep 2
  if curl -fsS "http://127.0.0.1:$PORT/api/health/" | grep -q "\"release\":\"$ID\""; then live=1; break; fi
done
if [ "$live" != 1 ]; then
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    log "Canlı kontrol başarısız — önceki sürüme dönülüyor: $(basename "$PREV")"
    ln -sfn "$PREV" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"
    ( cd "$BASE/current" && RELEASE_ID="$(cat "$PREV/RELEASE" 2>/dev/null)" pm2 reload ecosystem.config.cjs --update-env ) || true
  fi
  die "Deploy geri alındı. Not: migration geri alınmadı; gerekirse backups/predeploy-$ID.dump"
fi
pm2 save >/dev/null

# ---------- 9. Temizlik ----------
ls -1dt "$BASE"/releases/*/ 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -rf
find "$BASE/backups" -name 'predeploy-*.dump' -mtime +30 -delete
log "Tamamlandı: $ID"
