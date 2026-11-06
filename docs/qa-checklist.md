# QA kontrol listesi

Otomatik testler: `npm test` (birim, 51) · `npm run test:e2e` (Playwright, 31 salt okunur + yazma senaryosu). Aşağıdakiler canlıya geçişten önce **gerçek cihaz/hesaplarla** elle doğrulanmalıdır.

## Formlar
- [ ] Teklif sihirbazı: 5 adım, hizmet ön seçimi (`?hizmet=`), dinamik sorular, dosya ekleme (PDF/görsel), KVKK zorunlu, teklif numarası ekranda
- [ ] Teklif admin'de görünüyor; ek indiriliyor; durum/not/atama/CSV
- [ ] SMTP tanımlıyken: ekibe bildirim ve müşteriye "alındı" e-postası geliyor (spam klasörü dahil kontrol)
- [ ] SMTP yanlışken: kayıt yine oluşuyor, Bildirimler'de "başarısız", yeniden gönder çalışıyor
- [ ] İletişim ve ücretsiz SEO analizi formları; hata mesajları Türkçe ve alanın yanında
- [ ] Çift tıklama / sayfayı yenileme çift kayıt oluşturmuyor

## Bağlantılar ve SEO
- [ ] Menü, footer ve CTA'ların hepsi doğru sayfaya gidiyor; SEO merkezinde "kırık iç bağlantı" yok
- [ ] Eski URL'ler: 6 hizmet adresi 200; `/blog-2/` → `/blog/` 301; demo URL'ler 410 (redirect-map.csv'den örneklem)
- [ ] `http://`, `lagenyazilim.com.tr` → tek adımda `https://www.lagenyazilim.com.tr/...`
- [ ] Sitemap yalnızca yayındaki sayfalar; Search Console'a gönderildi
- [ ] Google Rich Results Test: ana sayfa, bir hizmet sayfası, bir blog yazısı (yayınlandığında)
- [ ] robots.txt üretimde `Allow: /`

## Görünüm ve erişilebilirlik
- [ ] 320 / 390 / 768 / 1280 / 1920 / 2560 px — taşma, kırık hizalama yok
- [ ] Açık ve koyu tema tüm sayfalar
- [ ] Klavye ile: menü, mega menü (Esc), mobil menü, SSS akordeonu, teklif sihirbazı baştan sona
- [ ] Ekran okuyucu (NVDA veya VoiceOver): ana sayfa ve teklif formu
- [ ] %200 yakınlaştırma
- [ ] `prefers-reduced-motion` açıkken animasyon yok

## Tarayıcılar
| | Chrome | Firefox | Safari | Edge | Samsung |
|---|---|---|---|---|---|
| Masaüstü | [ ] | [ ] | [ ] | [ ] | — |
| iPhone / iPad | — | — | [ ] | — | — |
| Android | [ ] | — | — | — | [ ] |

## Yönetim paneli
- [ ] Yazı oluştur → taslak 404 → yayınla → sitede, sitemap'te; zamanlanmış yayın ileri saatte görünmüyor
- [ ] Yayındaki yazının slug'ı değişince eski adres 301
- [ ] Bölge sayfası kalite kapısı (100 olmadan yayın yok)
- [ ] Medya yükleme, alt metin, kullanımdaki görselin silinememesi
- [ ] Roller: editör teklifleri göremiyor, satış içerik düzenleyemiyor
- [ ] 2FA aç/kapat; kayıp telefon senaryosu (süper yönetici sıfırlama)

## Performans (canlı ortamda tekrar ölçülecek)
- [ ] PageSpeed Insights mobil/masaüstü (ana sayfa, hizmet, teklif)
- [ ] Search Console Core Web Vitals (alan verisi oluştuğunda)
