# VPS deploy

Hedef: Ubuntu 22.04/24.04 · Node.js 22 LTS (veya 24) · PostgreSQL 16+ (VPS'te veya Neon) · Nginx · PM2 · Let's Encrypt.

> Sunucuda başka projeler olabilir. Kurulumdan önce mevcut durumu kayıt altına alın ve **hiçbir mevcut vhost'u, PM2 sürecini, portu veya veritabanını değiştirmeyin.**

## 0. Ön envanter (değişiklik yapmadan)

```bash
sudo ss -ltnp                      # kullanılan portlar — 3490 ve 3499 boş olmalı
pm2 ls                             # mevcut PM2 uygulamaları — "lagen-web" adı kullanılmamalı
ls /etc/nginx/sites-enabled/       # mevcut vhost'lar
sudo nginx -t                      # mevcut yapılandırma geçerli mi
psql -l 2>/dev/null | head         # (yerel Postgres varsa) mevcut veritabanları
df -h /var/www                     # en az 3 GB boş alan
```

Port çakışırsa `.env` içinde `PORT` ve Nginx `upstream` değerini birlikte değiştirin.

## 1. Kullanıcı ve dizinler

```bash
sudo adduser --system --group --home /var/www/lagen lagen
sudo -u lagen mkdir -p /var/www/lagen/{releases,shared/storage,backups,logs}
sudo -u lagen git clone git@github.com:<hesap>/<repo>.git /var/www/lagen/repo
```

## 2. Ortam değişkenleri — `/var/www/lagen/shared/.env`

`.env.example` dosyasındaki tüm anahtarlar. Üretim için zorunlu:

| Anahtar | Not |
|---|---|
| `DATABASE_URL` | Uygulama bağlantısı (Neon kullanılıyorsa pooler olabilir) |
| `DATABASE_URL_DIRECT` | Migration ve yedek için **pooler olmayan** bağlantı |
| `SESSION_SECRET` | ≥32 karakter rastgele; değişirse oturumlar ve şifreli SMTP/2FA sırları geçersizleşir |
| `NEXT_PUBLIC_SITE_URL` | `https://www.lagenyazilim.com.tr` (robots.txt yalnızca bu host'ta taramaya açılır) |
| `STORAGE_DIR` | `/var/www/lagen/shared/storage` — release klasörünün DIŞINDA |
| `PORT` | `3490` (varsayılan) |
| `SMTP_*`, `NOTIFY_TO` | İsteğe bağlı; boşsa admin panelinden girilir |
| `UMAMI_ORIGIN` | Umami kullanılacaksa (CSP'ye eklenir) |

```bash
sudo chmod 600 /var/www/lagen/shared/.env && sudo chown lagen:lagen /var/www/lagen/shared/.env
```

`SITE_URL_ALLOW_INSECURE` üretimde **tanımlanmamalı** (deploy betiği 1 ise durur).

## 3. İlk deploy

```bash
sudo -u lagen bash -lc 'cd /var/www/lagen/repo && scripts/deploy.sh main'
sudo -u lagen bash -lc 'cd /var/www/lagen/current && npm run db:seed && npm run admin:create -- info@lagenyazilim.com.tr "Ad Soyad"'
pm2 startup systemd -u lagen --hp /var/www/lagen   # çıktıdaki komutu çalıştırın (yeniden başlatmada PM2)
```

## 4. Nginx + SSL

```bash
sudo cp /var/www/lagen/current/deploy/nginx/lagenyazilim.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/lagenyazilim.conf /etc/nginx/sites-enabled/
sudo mkdir -p /var/www/letsencrypt
# İlk sertifika: 443 bloklarını geçici yorum satırı yapıp yalnızca 80 bloğuyla nginx -t && reload, sonra:
sudo certbot certonly --webroot -w /var/www/letsencrypt -d lagenyazilim.com.tr -d www.lagenyazilim.com.tr
sudo nginx -t && sudo systemctl reload nginx
```

Certbot yenileme zamanlayıcısı (`systemctl list-timers | grep certbot`) otomatik kurulur.

## 5. Sonraki deploy'lar

```bash
sudo -u lagen /var/www/lagen/current/scripts/deploy.sh main
```

Betik sırasıyla: ön kontroller (araçlar, Node sürümü, `.env` anahtarları, port, disk) → `git fetch` → yeni release klasörü → `npm ci` → **veritabanı yedeği** → migration → build → yeni sürümü 3499 portunda **ayrı süreçte sağlık kontrolü** → `current` bağlantısını atomik değiştirme → `pm2 startOrReload` → canlı sağlık kontrolü → başarısızsa **önceki sürüme otomatik dönüş** → eski release temizliği (son 5 kalır).

- Build, migration veya ön sağlık kontrolü başarısız olursa çalışan sürüme **dokunulmaz**.
- Veri kaybettirebilecek migration (`DROP`, `TRUNCATE`, tip değişikliği…) `ALLOW_DESTRUCTIVE=1` verilmeden uygulanmaz. Bu tür migration'lar önce staging'de denenmeli.
- Geri dönüş migration'ları geri almaz; her deploy öncesi yedek `backups/predeploy-<id>.dump` olarak saklanır.

Elle geri dönüş: `scripts/rollback.sh` (önceki sürüm) veya `scripts/rollback.sh <release-id>`.

## 6. İzleme

- Sağlık: `GET /api/health/` → `{"ok":true,"db":"ok","release":"…"}` (uptime izleyicisine eklenmeli)
- Loglar: `/var/www/lagen/logs/web.{out,err}.log` (`pm2 install pm2-logrotate` önerilir)
- Yedek: [backup-restore.md](backup-restore.md)

## 7. Canlıya geçiş günü

1. DNS'i VPS'e yönlendirmeden önce `hosts` dosyasıyla yeni sunucuyu test edin
2. `docs/qa-checklist.md` maddeleri
3. DNS değişikliği → certbot → `curl -I http://lagenyazilim.com.tr/ankara-web-tasarim/` tek adımda `https://www.…/ankara-web-tasarim/`
4. Search Console: yeni `sitemap.xml` gönderin; doğrulama kodunu Admin › Site ayarları'na girin
5. İlk hafta: Search Console kapsam raporu ve 404/410 adresleri
