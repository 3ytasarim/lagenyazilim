# Yedekleme ve geri yükleme

Yedeklenenler: PostgreSQL veritabanı ve dosya deposu (`STORAGE_DIR`: medya + teklif ekleri). Kod git'tedir; `shared/.env` ayrıca güvenli bir yerde (parola yöneticisi) saklanmalıdır.

## Otomatik yedek

`scripts/backup.sh` — günlük, 14 gün saklama (`BACKUP_KEEP_DAYS`), dosya izinleri 600, dump bütünlük kontrolü (`pg_restore --list`).

```cron
15 3 * * * /var/www/lagen/current/scripts/backup.sh >> /var/www/lagen/logs/backup.log 2>&1
```

Sunucu dışı kopya: `rclone` yapılandırıp `.env` içinde `BACKUP_REMOTE=<hedef>` tanımlayın. **Yedeklerin tek kopyası aynı VPS'te kalmamalı.** Yedekler kişisel veri (teklif ve başvuru kayıtları) içerir; uzak hedef şifreli olmalı (rclone crypt) ve KVKK saklama sürelerine uyulmalıdır.

Deploy betiği her deploy öncesi ayrıca `backups/predeploy-<id>.dump` alır (30 gün).

Neon kullanılıyorsa Neon'un kendi geri dönüş (PITR) özelliği ek bir güvencedir; yine de günlük `pg_dump` alınmalıdır.

## Geri yükleme

> Önce **ayrı bir veritabanına** geri yükleyip kontrol edin; canlı veritabanının üzerine doğrudan yazmayın.

```bash
# 1) Boş bir veritabanına geri yükle
createdb lagen_restore_test
pg_restore --no-owner --dbname=lagen_restore_test /var/www/lagen/backups/daily/db-YYYYMMDD-HHMM.dump

# 2) Kontrol
psql lagen_restore_test -c "select count(*) from quote_requests; select count(*) from services;"

# 3) Canlıya alma (bakım penceresinde): uygulamayı durdur → bağlantıyı yeni DB'ye çevir veya hedefi temizleyip yükle
pm2 stop lagen-web
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL_DIRECT" db-YYYYMMDD-HHMM.dump
pm2 start lagen-web
```

Dosya deposu:

```bash
tar -C /var/www/lagen/shared -xzf /var/www/lagen/backups/daily/storage-YYYYMMDD-HHMM.tar.gz
```

## Geri yükleme tatbikatı

Ayda bir: son yedeği test veritabanına yükleyin, `select count(*)` ile tabloları karşılaştırın, rastgele bir teklif ekini indirip açın. Tarih ve sonucu bu belgeye not edin.
