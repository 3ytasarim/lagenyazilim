# Güvenlik kontrol listesi

Durum: ✅ uygulandı ve test edildi · ☑ uygulandı (kod incelemesi) · ⏳ canlıya geçişte yapılacak

## Kimlik doğrulama ve oturum

- ✅ Parolalar Argon2id (19 MiB, 2 tur); en az 12 karakter, harf + rakam
- ✅ Oturum: 32 bayt rastgele token; çerezde ham, veritabanında SHA-256. `HttpOnly`, `SameSite=Lax`, üretimde `Secure`; 12 saat kayan süre
- ✅ Giriş hız sınırı (IP: 20/15 dk, e-posta: 8/15 dk) ve 5 hatalı denemede 15 dk kilit; hesap var/yok bilgisi sızdırılmaz (sabit süreli yanıt)
- ✅ İsteğe bağlı 2FA (TOTP, RFC 6238): imzalı 5 dk "bekleyen giriş" çerezi; aynı kodun tekrar kullanımı engellenir; kod denemesi hız sınırlı; sır AES-256-GCM ile şifreli
- ✅ Parola sıfırlama: tek kullanımlık, 30 dk, token özeti saklanır; başarıda diğer oturumlar kapanır
- ✅ Kullanıcı daveti: parola paylaşılmaz, davet bağlantısıyla kullanıcı kendisi belirler
- ✅ Pasifleştirme ve 2FA sıfırlama tüm oturumları kapatır; son süper yönetici kaldırılamaz

## Yetkilendirme ve istek güvenliği

- ✅ Her admin sayfası ve server action'ın ilk satırı `requireUser(izin)` / `guard(izin, csrf)`; istemci tarafı gizleme yetki sayılmaz
- ✅ Roller: super_admin / editor / sales — izin matrisi `src/lib/auth/permissions.ts`
- ✅ CSRF: oturuma bağlı token (sabit zamanlı karşılaştırma) + Next server action Origin kontrolü
- ☑ `"use server"` dosyalarında yalnızca korumalı action'lar export edilir (her export dışarıdan çağrılabilir bir uç noktadır)
- ✅ Açık yönlendirme yok: giriş sonrası `next` yalnızca `/admin/…`; yönlendirme kuralları yalnızca site içi hedef
- ✅ Canonical override yalnızca aynı host

## Girdi, çıktı ve dosyalar

- ✅ Tüm formlar sunucuda Zod ile doğrulanır (istemci doğrulamasına güvenilmez)
- ✅ Zengin metin: Tiptap HTML'i sunucuda `sanitize-html` izin listesiyle temizlenir (script, olay öznitelikleri, `javascript:`, YouTube dışı iframe, `style` reddedilir) — birim testli
- ✅ JSON-LD çıktısında `<` kaçışlanır
- ✅ SQL: Drizzle parametreli sorgular; ham SQL'lerde de parametre kullanılır
- ✅ Dosya yükleme: uzantı + MIME + **magic byte** + boyut; dosya adı UUID; medya EXIF'ten arındırılıp WebP'ye çevrilir (SVG kabul edilmez)
- ✅ Teklif ekleri `storage/private` altında; yalnızca yetkili rota indirir (`Content-Disposition: attachment`, `nosniff`, `sandbox` CSP); indirmeler işlem kaydında
- ✅ CSV dışa aktarmada formül enjeksiyonu kaçışlanır
- ✅ Formlar: bot tuzağı, gönderim süresi kontrolü, IP hız sınırı, idempotency anahtarı

## Başlıklar ve taşıma

- ✅ CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`; yalnızca GA4/Umami/YouTube alanları açık). Not: statik üretim nedeniyle `script-src 'unsafe-inline'` (Next hidrasyon betikleri) — nonce tabanlı CSP dinamik render gerektirir
- ✅ `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Powered-By` kapalı
- ☑ HSTS üretimde (uygulama + Nginx)
- ⏳ TLS 1.2+/1.3, Let's Encrypt otomatik yenileme (`deploy/nginx/lagenyazilim.conf`)
- ✅ Admin: `X-Robots-Tag: noindex`, `Cache-Control: no-store`

## Veri koruma (KVKK)

- ✅ Loglarda ve kayıtlarda IP yerine tuzlu SHA-256 özeti
- ✅ İşlem kaydında e-posta/telefon/parola alanları maskelenir
- ✅ Teklif ve başvurularda KVKK onay zamanı ve metin sürümü saklanır; açık rıza ayrı ve isteğe bağlı
- ✅ Analitik yalnızca çerez onayından sonra yüklenir
- ⏳ Yasal metinler hukuki onay bekliyor (sitede uyarı bandıyla, `noindex`)
- ⏳ Saklama süreleri belirlenip periyodik silme/anonimleştirme planlanmalı

## Sırlar ve bağımlılıklar

- ✅ `.env` git dışında; `.env.example` yalnızca anahtar adları
- ✅ SMTP parolası ve TOTP sırları veritabanında AES-256-GCM şifreli (anahtar `SESSION_SECRET`'tan türetilir)
- ✅ `npm audit --omit=dev`: **0** açık. Geliştirme bağımlılıklarında 14 orta seviye uyarı (drizzle-kit → esbuild geliştirme sunucusu, eslint → minimatch, @tailwindcss/typography → postcss-selector-parser); hiçbiri üretimde çalışan koda girmez. Önerilen düzeltmeler büyük sürüm düşürmesi gerektirdiği için uygulanmadı; yeni sürümler çıktıkça güncellenmeli
- ⏳ Canlıya geçmeden: QA test hesabı `qa-admin@lagen.test` silinmeli; ilk yönetici 2FA'yı açmalı

## Altyapı (canlıya geçişte)

- ⏳ Uygulama yalnızca `127.0.0.1`'e bağlanır (PM2 `-H 127.0.0.1`); 3490 portu dışarıya kapalı olmalı (`ufw allow 22,80,443`)
- ⏳ SSH: parola girişi kapalı, anahtar ile; `fail2ban`
- ⏳ Otomatik güvenlik güncellemeleri (`unattended-upgrades`)
- ⏳ Sunucu dışı şifreli yedek ve aylık geri yükleme tatbikatı
