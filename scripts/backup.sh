#!/usr/bin/env bash
# Günlük yedek: PostgreSQL (custom format) + dosya deposu (medya + teklif ekleri).
# Cron örneği (her gece 03:15):  15 3 * * * /var/www/lagen/current/scripts/backup.sh >> /var/www/lagen/logs/backup.log 2>&1
# Uzak kopya için BACKUP_REMOTE (ör. rclone hedefi "b2:lagen-yedek") tanımlanırsa yedekler oraya da gönderilir.
set -Eeuo pipefail
BASE="${LAGEN_BASE:-/var/www/lagen}"
set -a; # shellcheck disable=SC1091
. "$BASE/shared/.env"; set +a
DEST="$BASE/backups/daily"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M)"
mkdir -p "$DEST"
umask 077  # yedekler kişisel veri içerir: yalnızca sahibi okuyabilir

pg_dump --format=custom --no-owner --dbname="$DATABASE_URL_DIRECT" --file="$DEST/db-$STAMP.dump"
tar -C "$(dirname "$STORAGE_DIR")" -czf "$DEST/storage-$STAMP.tar.gz" "$(basename "$STORAGE_DIR")"

# Bütünlük: dump okunabiliyor mu?
pg_restore --list "$DEST/db-$STAMP.dump" >/dev/null

if [ -n "${BACKUP_REMOTE:-}" ] && command -v rclone >/dev/null; then
  rclone copy "$DEST/db-$STAMP.dump" "$BACKUP_REMOTE/" && rclone copy "$DEST/storage-$STAMP.tar.gz" "$BACKUP_REMOTE/"
fi

find "$DEST" -type f -mtime +"$KEEP_DAYS" -delete
echo "[$(date -Is)] yedek tamam: db-$STAMP.dump, storage-$STAMP.tar.gz"
