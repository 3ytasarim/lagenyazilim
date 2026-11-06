# Ankara Yerel SEO Planı

## İlkeler

1. **Ofis ≠ hizmet bölgesi.** Tek fiziksel adres: Harbiye Mah., Bayram Çıtak Sok., Dikmen / Çankaya (bina no ve posta kodu müşteriden bekleniyor). Diğer ilçeler için şube, adres, harita pini veya `LocalBusiness` üretilmez.
2. **Veri ≠ sayfa.** 25 ilçenin tamamı `regions` tablosunda bulunur; sayfa yalnızca `region_pages` kaydı yayın kapısını geçerse oluşur.
3. **Kopya yok.** Şablona ilçe adı yerleştirerek içerik üretilmez. Her sayfa insan tarafından yazılır/incelenir.

## Yayın kapısı (region_pages)

Yayına alma (`published`) sunucu tarafında şu koşulları ister:

| Kontrol | Eşik |
|---|---|
| Bölge kaydı doğrulanmış (`regions.is_verified`) | zorunlu |
| `intro + local_needs + local_sectors + service_model` özgün metin | ≥ 350 kelime |
| Aynı türdeki diğer bölge sayfalarıyla benzerlik (5-gram Jaccard) | < %35 |
| Bölgeye özgü SSS | ≥ 3 |
| SEO title + description dolu ve tekil | zorunlu |
| İlgili hizmet bağlantısı | ≥ 2 |
| Durum geçişi | `review` → `published` yalnızca `super_admin` / `editor` |

Sonuç `quality_score` olarak saklanır ve admin'de gerekçeleriyle gösterilir. Eşiği geçemeyen sayfa yayınlanamaz; yayındaki sayfa düzenlemeyle eşik altına düşerse `noindex` olur ve sitemap'ten çıkar.

## İlçeler (25)

Öncelik 1 (ilk içerik dalgası): Çankaya, Yenimahalle, Etimesgut, Keçiören, Gölbaşı, Sincan, Altındağ, Mamak, Pursaklar.
Öncelik 2 (yalnızca veri, sayfa yok): Akyurt, Ayaş, Bala, Beypazarı, Çamlıdere, Çubuk, Elmadağ, Evren, Güdül, Haymana, Kalecik, Kahramankazan, Kızılcahamam, Nallıhan, Polatlı, Şereflikoçhisar.

İlçe listesi 2026 itibarıyla Ankara'nın 25 ilçesidir; seed'de `is_verified=true`, kaynak "Ankara Valiliği ilçe listesi" olarak işaretlenecek (Sprint 4'te kaynak bağlantısıyla teyit).

## Mahalle / semt / ticari bölge kayıtları

Resmî listelerle doğrulandı (2026-11-04) — ayrıntı ve kaynaklar: [neighborhood-verification.md](neighborhood-verification.md). Kayıtlar `regions` tablosunda; doğrulanmamışlar yayın kapısından geçemez.

| Ad | Nitelik | İlçe | Doğrulandı | Not |
|---|---|---|---|---|
| Kızılay, Çukurambar, Söğütözü, Balgat, Ayrancı, Bahçelievler, Or-An (Oran), Çayyolu | mahalle | Çankaya | evet | Çukurambar ayrı resmî mahalledir (Kızılırmak'a bağlı değil); Oran'ın resmî yazımı "Or-An" |
| Harbiye | mahalle | Çankaya | evet | Ofis mahallesi |
| Dikmen | semt | Çankaya | hayır | "Dikmen" adlı mahalle yok (yalnız Yukarı Dikmen); adres ve şemada kullanılmaz |
| Ümitköy | semt | Çankaya | hayır | Resmî karşılığı "Ümit" mahallesi; semt sınırı doğrulanmadı |
| Ostim | mahalle (+OSB) | Yenimahalle | evet | |
| İvedik | OSB | Yenimahalle | hayır | İvedik OSB ile İvedik Mahallesi aynı değil; OSB sayfası mahalleye bağlanmamalı |
| Batıkent | semt | Yenimahalle | hayır | Kapsadığı mahalleler doğrulanamadı |
| Bağlıca, Eryaman | mahalle | Etimesgut | evet | Yeni Bağlıca ayrı mahalle |
| İncek | mahalle | Gölbaşı | evet | golbasi.bel.tr Adıyaman'ın Gölbaşı'sıdır; kaynak olarak kullanılmaz |

Mahalle sayfaları ilçe sayfalarından sonra, yalnızca gerçek talep (GSC sorguları, gelen teklifler) ve bölgesel referans varsa açılır.

## Hizmet + bölge birleşimleri

Varsayılan: oluşturulmaz. Açılma şartı: (a) GSC'de o birleşim için gösterim, (b) bölgeye özgü vaka/referans, (c) yayın kapısı. Örn. `/hizmet-bolgeleri/ankara/cankaya/web-tasarim/`. Bu sayfa ana hizmet sayfasıyla kanibalize olmamalı; canonical kendisi, ana hizmete bağlantı verir.

## İçerik iskeleti (ilçe sayfası)

1. H1: "{İlçe} için Web Tasarım, Yazılım ve Dijital Çözümler" (her sayfada özgün varyasyon)
2. Kısa cevap paragrafı: bölgeye nasıl hizmet verildiği (yerinde toplantı / uzaktan, ofise uzaklık gibi gerçek bilgi)
3. Bölgedeki işletme profili ve ihtiyaçlar (doğrulanabilir: OSB, iş merkezleri, sektör yoğunluğu — kaynak gösterilerek)
4. İlgili hizmetler (en uygun 2–4)
5. Varsa bölgeden gerçek referans
6. Bölgeye özgü SSS
7. Teklif CTA

## Google Business Profile

Tek profil (Çankaya ofisi). Hizmet bölgeleri GBP'de ilçe olarak tanımlanabilir. Sitede GBP bağlantısı ve harita yalnızca iletişim sayfasında (lazy, tıklayınca yüklenen).
