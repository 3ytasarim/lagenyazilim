# Lagen Yazılım — Proje Planı

- **Kapsam:** lagenyazilim.com.tr'nin yerine geçecek, CMS + teklif CRM'li, kendi VPS'inde çalışan Next.js platformu
- **Durum:** Sprint 0–5 tamamlandı (2026-11-04) — canlıya geçiş için: [production-readiness.md](production-readiness.md)
- **Kaynaklar:** [legacy-url-audit.md](legacy-url-audit.md), [legacy-inventory.json](legacy-inventory.json), [redirect-map.csv](redirect-map.csv)

## 1. Proje kararları

| Soru | Karar |
|---|---|
| Hedef müşteri | Ankara merkezli KOBİ ve kurumsal firmalar (B2B), özellikle Çankaya / Yenimahalle / Etimesgut ticari bölgeleri ve OSB'ler |
| Birincil CTA | **Proje Teklifi Al** → `/proje-teklifi/` (5 adımlı sihirbaz) |
| İkincil CTA | Ücretsiz SEO Analizi (`/ucretsiz-seo-analizi/`), telefon, WhatsApp |
| Dil | Yalnızca Türkçe → hreflang üretilmez |
| Canonical host | `https://www.lagenyazilim.com.tr`, sonda `/` (mevcut davranış korunur, `trailingSlash: true`) |
| Marka | Logo korunur (lacivert wordmark + mavi→camgöbeği altıgen "L"). Eski sitedeki mor/turuncu tema renkleri markaya ait değil, kullanılmaz |
| Sahte içerik | Yok. Demo logo şeridi, lorem ekip, stok portföy, doğrulanmamış sayaçlar ("1000+ proje", "%97") taşınmaz |
| Veritabanı | PostgreSQL (geliştirme: Neon; üretim: VPS Postgres veya Neon). Uygulama yalnızca `DATABASE_URL` bilir |
| Barındırma | Ubuntu VPS, Nginx + PM2, release klasörlü atomik deploy |

## 2. Teknoloji

| Alan | Seçim | Not |
|---|---|---|
| Framework | Next.js 16.4 (App Router), React 19.3 | Server Components varsayılan |
| Dil | TypeScript 5.9 strict + `noUncheckedIndexedAccess` | |
| Stil | Tailwind CSS 4.3 + kendi token sistemi, Radix primitive'leri | shadcn/ui yaklaşımı: bileşen kodu repoda |
| ORM | **Drizzle 0.45** + `pg` | Prisma'nın güncel `latest` etiketi 8.0 RC; kararlı olmayan sürüm seçilmedi. Drizzle motor binary'si gerektirmez, VPS'te sorunsuz |
| Doğrulama | Zod 4 (istemci + sunucu aynı şema) | |
| Form | React Hook Form | Yalnızca teklif sihirbazı ve admin formlarında |
| Editör | Tiptap 3 → JSON saklanır, sunucuda sanitize edilmiş HTML üretilir | |
| Parola | Argon2id (`@node-rs/argon2`) | |
| Görsel | sharp → AVIF/WebP varyantları, blur placeholder | |
| E-posta | nodemailer (SMTP) + `notifications` kuyruk tablosu | |
| Test | Vitest (birim), Playwright (E2E, Sprint 5) | |
| Animasyon | CSS + küçük IntersectionObserver; Motion yalnızca gerekirse | JS bütçesi için |

## 3. Site haritası

```
/                                   Ana sayfa
/hakkimizda/                        Kurumsal (eski URL korunur)
/ankara-web-tasarim/                Hizmet (eski URL)
/ankara-seo-hizmeti/                Hizmet (eski URL)
/ankara-sosyal-medya-yonetimi/      Hizmet (eski URL)
/ankara-ozel-yazilim/               Hizmet (eski URL)
/ankara-katalog-tasarimi/           Hizmet (eski URL)
/ankara-fotograf-cekimi/            Hizmet (eski URL; "Fotoğraf ve Drone Çekimi")
/hizmetlerimiz/                     Hizmet dizini
/cozumler/                          Sektöre göre çözümler (taslak, onaylı içerik gelene kadar noindex)
/projeler/                          Portföy (yalnızca müşteri izinli projeler)
/projeler/[slug]/                   Vaka analizi
/hizmet-bolgeleri/                  Bölge dizini
/hizmet-bolgeleri/ankara/           Şehir sayfası
/hizmet-bolgeleri/ankara/[ilce]/            İlçe (yayın kapısından geçerse)
/hizmet-bolgeleri/ankara/[ilce]/[alt]/      Mahalle/semt veya hizmet+ilçe birleşimi
/blog/  /blog/[slug]/  /blog/kategori/[slug]/  /blog/yazar/[slug]/
/proje-teklifi/                     Teklif sihirbazı (ana dönüşüm)
/ucretsiz-seo-analizi/              SEO analiz talebi
/iletisim/                          İletişim (eski URL)
/kvkk-aydinlatma-metni/  /gizlilik-politikasi/  /cerez-politikasi/  /acik-riza-metni/
/sitemap.xml (+ /sitemaps/[tür].xml)  /robots.txt  /llms.txt
/admin/...                          Yönetim paneli (noindex + oturum zorunlu)
```

Eski → yeni eşleşmeler ve 87 demo URL'nin 410 kararı: [redirect-map.csv](redirect-map.csv).

## 4. Sprintler

| Sprint | İçerik | Çıktı |
|---|---|---|
| **0 — Audit ve planlama** ✅ | Mevcut site taraması, URL envanteri, yönlendirme haritası, ERD, mimari, SEO/yerel SEO stratejisi | `docs/*`, `src/lib/db/schema/*`, `drizzle/0000_init.sql` |
| **1 — Design system + frontend** ✅ | Token'lar, tipografi, layout, header/mega menü/footer, ana sayfa, hizmet şablonu, portföy, blog arayüzü, teklif sihirbazı UI, loading/error/404 | Çalışan public site (seed içerikle) |
| **2 — Veritabanı + CMS** ✅ | Migration uygulama, güvenli seed, admin auth (oturum, CSRF, rate limit, roller), dashboard, blog/hizmet/proje/sayfa CRUD, medya kütüphanesi, site ayarları, revizyonlar | `/admin` |
| **3 — CRM + formlar** ✅ | Teklif backend (dosya yükleme, idempotency, numara), teklif yönetimi, durum geçmişi, notlar, atama, CSV, SMTP bildirimleri, SEO analiz + iletişim formları | Uçtan uca form akışları |
| **4 — SEO, GEO, yerel** ✅ | Metadata/canonical sistemi, JSON-LD, sitemap, robots, redirect motoru, bölge modeli + yayın kapısı, ilçe içerikleri, mahalle doğrulama, iç link, SEO kontrol merkezi | Teknik SEO tamam |
| **5 — Test + VPS** ✅ | Birim/entegrasyon/E2E, erişilebilirlik, Lighthouse, SEO crawl, güvenlik incelemesi, deploy/rollback/backup betikleri, üretim hazırlık raporu | `docs/deployment.md` vb. |

## 5. Müşteriden beklenenler (yayın öncesi zorunlu)

1. Vektör logo (SVG/AI) ve kurumsal renk kodları
2. Tüzel kişi unvanı, vergi dairesi/no (KVKK veri sorumlusu ve footer için)
3. Tam adres (bina no, posta kodu), çalışma saatleri, Google Business Profile bağlantısı
4. Yayın izni alınmış gerçek projeler: müşteri adı, ekran görüntüleri, hizmetler, (varsa) doğrulanmış sonuçlar
5. Üç yorum sahibinden (Fimaksan, Doğuş Makina, Efe İş Elbiseleri) yayın onayı
6. Yazar/ekip bilgileri (blog E-E-A-T ve Person şeması için)
7. Google Ads danışmanlığı, kurumsal kimlik, grafik tasarım, e-ticaret gerçekten sunuluyor mu?
8. SEO sayfasındaki hilkomyazilim.com bağlantısı ve "hilkom" WordPress kullanıcısının durumu
9. Mevcut GA4 mülkü (`G-NNBMPZYSQW`) yeni sitede sürdürülecek mi
10. KVKK/gizlilik metinlerinin hukuki onayı
11. SMTP bilgileri, VPS erişimi (deploy aşamasında)

## 6. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Hizmet sayfalarının mevcut sıralaması | Trafik kaybı | URL'ler birebir korunur, içerik genişletilir, başlıktan "2023" kaldırılır |
| 87 demo URL'nin indekste olması | Kalite sinyali | 410 Gone; sitemap'ten çıkar; GSC'de kaldırma isteği opsiyonel |
| Trailing slash'sız varyantların 200 dönmesi | Kopya içerik | Yeni sistemde 308 ile tek forma |
| Gerçek proje/referans yokluğu | Güven ve dönüşüm | Bölümler veri yokken gizlenir (boş bölüm göstermez), süreç ve kapsam anlatımı öne çıkar |
| Yerel sayfaların ince içerik olması | Ceza/indeks dışı | Yayın kapısı (kalite skoru + insan onayı), varsayılan noindex |
| Neon pooler + çok komutlu migration | Sessiz başarısızlık | Migration'lar `DATABASE_URL_DIRECT` (pooler değil) üzerinden |
| VPS'te başka projeler | Çakışma | Port/PM2/Nginx envanteri alınmadan deploy yok |
