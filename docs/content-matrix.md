# İçerik Matrisi

Durum: **Y** = seed ile yayında başlar · **T** = taslak, onay bekler · **V** = veri gelince

## Sayfalar

| URL | Arama niyeti | Birincil ifade | Kaynak | Durum |
|---|---|---|---|---|
| `/` | marka + ticari | Ankara web tasarım ve yazılım şirketi | Yeni yazım | Y |
| `/hakkimizda/` | marka | Lagen Yazılım | Eski site (doğrulanabilir kısım) + müşteri | Y (sayaçsız) |
| `/ankara-web-tasarim/` | ticari | Ankara web tasarım | Yeni yazım (eski içerikten konu başlıkları) | Y |
| `/ankara-seo-hizmeti/` | ticari | Ankara SEO hizmeti | Yeni yazım; backlink tanımı düzeltilir | Y |
| `/ankara-sosyal-medya-yonetimi/` | ticari | Ankara sosyal medya yönetimi | Yeni yazım | Y |
| `/ankara-ozel-yazilim/` | ticari | Ankara özel yazılım | Yeni yazım | Y |
| `/ankara-katalog-tasarimi/` | ticari | Ankara katalog tasarımı | Yeni yazım | Y |
| `/ankara-fotograf-cekimi/` | ticari | Ankara fotoğraf ve drone çekimi | Yeni yazım; drone izin/lisans bilgisi müşteriden | Y |
| `/hizmetlerimiz/` | gezinme | — | Hizmet kayıtları | Y |
| `/projeler/` | güven | Lagen Yazılım projeleri | İzinli projeler | V (boşken noindex + "yakında" yok, menüden gizli) |
| `/hizmet-bolgeleri/`, `/ankara/` | yerel | Ankara dijital ajans | Yeni yazım | Y |
| İlçe sayfaları (9) | yerel | {ilçe} web tasarım | Yerel araştırma | T |
| `/proje-teklifi/` | dönüşüm | — | — | Y |
| `/ucretsiz-seo-analizi/` | dönüşüm | ücretsiz SEO analizi | — | Y |
| `/iletisim/` | gezinme | Lagen Yazılım iletişim | site ayarları | Y |
| Yasal 4 sayfa | zorunlu | — | Taslak metin | T (hukuki onay bandıyla yayında; formlar bağlantı verir) |

## Onay bekleyen hizmet önerileri (`is_core=false`, taslak)

E-Ticaret, Mobil Uygulama, AI Otomasyonu, GEO Danışmanlığı, Hosting/Bakım, Google Ads Yönetimi, Kurumsal Kimlik/Grafik Tasarım.
Not: Google Ads, grafik tasarım ve kurumsal kimlik eski sitede metin içinde geçiyor; müşteri onayıyla ana hizmete alınabilir.

## Blog taslakları (10, hepsi T)

| # | Başlık | Küme | İlgili hizmet |
|---|---|---|---|
| 1 | Ankara'da profesyonel web sitesi yaptırırken nelere dikkat edilmeli? | Web | Web tasarım |
| 2 | Kurumsal web sitesi maliyetini hangi faktörler belirler? | Web | Web tasarım |
| 3 | Özel yazılım mı, hazır yazılım mı? Karar tablosu | Yazılım | Özel yazılım |
| 4 | SEO ajansı seçerken sorulması gereken 12 soru | SEO | SEO |
| 5 | Google Ads ve SEO: farklar, ne zaman hangisi? | SEO/Reklam | SEO |
| 6 | Kurumsal web sitelerinde teknik SEO kontrol listesi | SEO | SEO, web |
| 7 | Web sitesi yenilerken SEO kaybı nasıl önlenir? | SEO | Web, SEO |
| 8 | Yapay zekâ aramalarında işletmeler nasıl daha anlaşılır olur? | GEO | SEO |
| 9 | Küçük işletmeler için 90 günlük dijital pazarlama planı | Pazarlama | Sosyal medya |
| 10 | Sanayi firmaları için katalog: baskı mı, dijital mi? | Katalog | Katalog, fotoğraf |

Taslaklar yapı + ana argümanlarla hazırlanır; kaynak gerektiren iddialar `[KAYNAK]` işaretiyle bırakılır, otomatik yayımlanmaz.

## İç link haritası (hizmetler)

```
Web tasarım ↔ SEO ↔ Özel yazılım
Web tasarım → Fotoğraf (görsel içerik) · Katalog (kurumsal kimlik)
SEO → Sosyal medya · Blog #4 #6 #7 #8
Katalog ↔ Fotoğraf
Her hizmet → Proje teklifi (hizmet ön seçili: /proje-teklifi/?hizmet=...)
```
