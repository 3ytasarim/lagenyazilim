# SEO + GEO Stratejisi

## Mevcut durumdan çıkan öncelikler (bkz. legacy-url-audit.md)

1. 6 hizmet URL'sini **aynen** koru; başlık/H1'den "2023" kaldır, tek H1, özgün ve kapsamlı içerik
2. 87 demo URL → **410**; yeni sitemap yalnızca gerçek sayfalar
3. Ana sayfa H1'i slogan ("Her Zaman Zirveye Oyna") değil değer önerisi olsun; slogan alt metin olabilir
4. Eksik şemalar: ProfessionalService (LocalBusiness alt türü), Service, BreadcrumbList, FAQPage (yalnızca görünür SSS)
5. Hizmetler arası bağlamsal iç link
6. NAP tutarlılığı: footer, iletişim, şema ve GBP aynı kaynaktan (`site_settings.business`)

## Metadata sistemi

`src/lib/seo/metadata.ts` → `buildMetadata({ path, title, description, image, robots, type })`:
- Başlık şablonu `"{title} | Lagen Yazılım"`; 60 karakteri aşarsa marka eki düşer
- Canonical = `SITE_URL + path` (mutlak, `www`, sonda `/`); `canonicalOverride` yalnızca aynı host'a izin verir (sunucu doğrulaması)
- `robots`: içerik `robotsIndex/robotsFollow` + yayın durumu; taslak/inceleme/arşiv her zaman `noindex`
- OG: `og:type` ana sayfada `website`, blogda `article`; görsel yoksa `opengraph-image` ile üretilen marka görseli
- Twitter: `summary_large_image`

Başlangıç metinleri brief'teki örneklerdir; admin SEO editöründen değiştirilebilir.

## Yapılandırılmış veri

| Sayfa | JSON-LD |
|---|---|
| Tümü | `Organization` + `WebSite` (tek `@graph`, `@id` ile bağlı) |
| Ana sayfa, iletişim | `ProfessionalService` — adres yalnızca gerçek Çankaya ofisi; `areaServed` = Ankara ve yayındaki ilçeler |
| Hizmet | `Service` (`provider` → Organization `@id`, `areaServed`), `BreadcrumbList`, görünür SSS varsa `FAQPage` |
| Bölge | `WebPage` + `BreadcrumbList` + `Service.areaServed` (ilçe); **ofis şeması üretilmez** |
| Blog yazısı | `BlogPosting` (`author` → yalnızca doğrulanmış `Person`, yoksa Organization), `datePublished/dateModified` |
| Proje | `CreativeWork` (yalnızca izinli) |

Yasak: `aggregateRating`, `Review` (gerçek, izinli ve sayfada görünür değilse), ikinci adres, uydurma tür.

## Sitemap

`/sitemap.xml` = sitemap index → `/sitemaps/pages.xml`, `services.xml`, `regions.xml`, `blog.xml`, `projects.xml`.
Kriter: `status=published` ∧ `publishedAt ≤ now` ∧ `robotsIndex` ∧ canonical kendisi. `lastmod` = `updatedAt`.

## robots.txt

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: https://www.lagenyazilim.com.tr/sitemap.xml
```
AI tarayıcıları (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) engellenmez — GEO hedefiyle uyumlu. Admin ayrıca `noindex` + oturum ile korunur.

## GEO

- `llms.txt`: şirket özeti, hizmetler, iletişim, önemli sayfalar (yalnızca doğrulanmış bilgi, otomatik üretim site ayarlarından)
- Her hizmet sayfasında 40–60 kelimelik "kısa cevap" paragrafı (Bu hizmet nedir, kime uygun, süreç, ne teslim edilir)
- Tablolar: kapsam karşılaştırmaları (ör. hazır yazılım vs özel yazılım)
- Yazar kutusu, yayın + güncelleme tarihi, kaynak listesi (blog)
- Görünür tarih ve sürüm: "Son güncelleme"
- Garanti dili yok ("AI cevaplarında görünürsünüz" gibi vaat kullanılmaz)

## Ölçüm

GSC doğrulama meta alanı (site ayarı), GA4/Umami çerez onayı sonrası yüklenir. Olay listesi: brief §16.
