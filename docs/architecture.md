# Mimari

## Katmanlar

```
src/app/(marketing)/      Public sayfalar — Server Components, ISR
src/app/admin/            Yönetim paneli — dinamik, oturum zorunlu, noindex
src/app/api/              Yalnızca form olmayan uçlar (dosya indirme, sağlık kontrolü, analitik)
src/components/           ui/ (primitive) · layout/ · home/ · services/ · blog/ · portfolio/ · forms/ · seo/ · admin/
src/lib/                  db/ · auth/ · seo/ · validation/ · email/ · storage/ · content/ · utils
src/server/
  repositories/           Saf veri erişimi (Drizzle sorguları), yetki bilmez
  services/               İş kuralları (teklif oluşturma, yayın kapısı, revizyon), yetki + audit burada
  actions/                Server Actions — ince katman: requireUser → Zod → service
```

Kural: sayfa ve action'lar repository'yi doğrudan çağırmaz; okuma tarafında `server/queries` (önbellekli, yalnız yayımlanmış içerik), yazma tarafında `server/services` kullanılır.

## Render ve önbellek

| Rota | Strateji |
|---|---|
| Ana sayfa, hizmet, bölge, blog detay | Statik + `revalidateTag` (admin kaydında ilgili tag temizlenir) |
| Blog listesi, arama | Sunucu render, sorgu parametresine göre |
| `/proje-teklifi/` | Statik kabuk + tek client island (sihirbaz) |
| `/admin/**` | Dinamik, `no-store` |
| `sitemap.xml` | `revalidate` + içerik tag'leri |

Önbellek tag'leri: `services`, `service:<slug>`, `posts`, `post:<slug>`, `projects`, `regions`, `settings`, `redirects`.

## Yönlendirme ve 410

`src/proxy.ts` (Next 16 middleware) sırası:
1. Host normalize: `lagenyazilim.com.tr` → `www.` (Nginx de yapar; uygulama da güvenlik ağı)
2. Trailing slash: Next `trailingSlash: true` → 308
3. Statik legacy kuralları (`src/lib/redirects/legacy.ts`, redirect-map.csv'den üretilir): 301 veya 410
4. Admin'de yönetilen `redirect_rules` — süreç içi bellek önbelleği (60 sn), `redirects` tag'iyle temizlenir
5. `/admin/**` için çerez ön kontrolü (asıl yetki sunucuda)

## Güvenlik modeli

- Oturum: rastgele 32 bayt token → çerezde ham, DB'de SHA-256. `HttpOnly; Secure; SameSite=Lax; Path=/`, 12 saat kayan süre
- CSRF: Server Actions Next'in Origin kontrolüne ek olarak oturuma bağlı token (hidden input) ile doğrulanır
- Yetki: her admin sayfası ve action'ın ilk satırı `requireUser(rol)`; istemci tarafı gizleme yetki sayılmaz
- Roller: `super_admin` (her şey + kullanıcılar + ayarlar), `editor` (içerik/medya/SEO), `sales` (teklif + lead)
- Rate limit: `rate_limits` tablosu (PM2 cluster'da ortak) — giriş, formlar, yükleme
- Dosyalar: `storage/public/` (medya, Nginx sunar) ve `storage/private/` (teklif ekleri, yalnızca yetkili rota). Uzantı + MIME + magic byte + boyut kontrolü; dosya adı UUID
- HTML: Tiptap JSON → sunucuda HTML → `sanitize-html` izin listesi → render
- Başlıklar: CSP (`next.config.ts`; statik üretim nedeniyle `script-src 'self' 'unsafe-inline'`, dış kaynaklar yalnızca GA4/Umami/YouTube), HSTS (üretim), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP
- 2FA: isteğe bağlı TOTP (`src/lib/auth/totp.ts`); parola sonrası imzalı 5 dk bekleyen giriş çerezi, kod tekrar kullanımı engelli
- Loglar: IP yerine tuzlu SHA-256 (`ipHash`), e-posta/telefon loglanmaz

## Bildirim akışı

Form kaydı → transaction commit → `notifications` satırı (pending) → `after()` ile SMTP gönderimi → sent/failed. Başarısızlar admin'de görünür ve yeniden denenebilir. E-posta hatası kaydı asla geri almaz.

## Ortamlar

| Ortam | DB | URL |
|---|---|---|
| Geliştirme | Neon (pooler: runtime, direct: migration) | http://localhost:3490 |
| Üretim | VPS PostgreSQL veya Neon | https://www.lagenyazilim.com.tr |

Ortam değişkenleri: `.env.example`.
