# Üretime hazırlık raporu

Tarih: 2026-11-04 · Kapsam: Sprint 0–5 · Ortam: yerel production build (`next start`) + Neon PostgreSQL 18 (geliştirme veritabanı)

> Bu rapordaki ölçümler **yerel makinede** alınmıştır. Canlı sunucu (VPS, Nginx, HTTP/2, gerçek ağ) üzerinde tekrar ölçülmeden "canlıda doğrulandı" sayılmamalıdır.

## Kabul kriterleri (brief §21)

| # | Kriter | Durum | Kanıt / not |
|---|---|---|---|
| 1 | Public site gerçek verilerle çalışıyor | ✅ | Tüm içerik PostgreSQL'den; statik içerik yalnızca seed kaynağı |
| 2 | Admin girişi güvenli | ✅ | Argon2id, DB oturumu, CSRF, hız sınırı, kilit, isteğe bağlı 2FA — E2E ile test edildi |
| 3 | Blog yazısı panelden oluşturulup yayımlanabiliyor | ✅ | E2E: taslak → 404, yayın → 200 |
| 4 | Yeni yazı doğru URL, title, description, canonical, sitemap | ✅ | E2E + sitemap kontrolü |
| 5 | Hizmet içerikleri panelden düzenlenebiliyor | ✅ | Hizmet formu + revizyon + yayın kapısı |
| 6 | Teklif veritabanına kaydedilip panelde görünüyor | ✅ | E2E: LGN-2026-001001 üretildi, panelde ve CSV'de |
| 7 | Teklif durumu güncellenebiliyor | ✅ | Durum geçmişi + notlar + atama |
| 8 | SMTP bildirimi test edildi | ⏳ | **SMTP bilgisi verilmedi; gerçek gönderim test edilmedi.** Bildirim kaydı ve "atlandı/başarısız/yeniden gönder" akışı test edildi |
| 9 | Bölge sayfaları yayın durumuna uygun indeksleniyor | ✅ | Kalite kapısı (100 puan), taslak 404, yayında sitemap'te — geçici QA sayfalarıyla doğrulandı |
| 10 | Eski önemli URL'ler çalışıyor / 301 | ✅ | 6 hizmet + kurumsal adresler 200; `/blog-2/` 301; 87 demo URL 410 |
| 11 | Structured data doğrulandı | ☑ | JSON-LD üretimi ve içerik tutarlılığı test edildi; **Google Rich Results Test canlı URL'de yapılmalı** |
| 12 | Sitemap yalnızca uygun sayfaları içeriyor | ✅ | Yayında + indekslenebilir + kendi canonical'ı |
| 13 | Mobilde taşma / kırık alan yok | ✅ | 390 px'te public ve admin sayfalarında yatay taşma 0 (otomatik test) |
| 14 | Lighthouse sonuçları raporlandı | ✅ | Aşağıda |
| 15 | Testler çalışıyor | ✅ | Birim 51/51 · E2E 31/31 (1 yazma senaryosu bilerek kapalı) |
| 16 | Production build başarılı | ✅ | Uyarısız |
| 17 | Admin ve özel belgeler public erişime kapalı | ✅ | `/admin` oturumsuz → giriş; teklif ekleri yalnızca yetkili rota; `noindex` |
| 18 | VPS deploy dokümantasyonu hazır | ✅ | [deployment.md](deployment.md), `scripts/deploy.sh`, `rollback.sh`, `backup.sh`, Nginx, PM2 — **betikler henüz gerçek bir VPS'te çalıştırılmadı** (sözdizimi kontrol edildi) |
| 19 | Örnek formlar uçtan uca test edildi | ✅ | Teklif (dosya ekli), iletişim, SEO analizi |
| 20 | Kritik işlev sahte UI olarak bırakılmadı | ✅ | Formlar, CRM, CMS, SEO, bölge kapısı gerçek |

## Lighthouse (yerel production build, üretim alan adıyla derlenmiş)

| Sayfa | Mobil P / A / BP / SEO | Mobil LCP | Masaüstü P / A / BP / SEO |
|---|---|---|---|
| `/` | 85 / 100 / 100 / 100 | 4.1 s | 99–100 / 100 / 100 / 100 |
| `/ankara-web-tasarim/` | 89 / 100 / 100 / 100 | 3.6 s | 100 / 100 / 100 / 100 |
| `/proje-teklifi/` | 87–88 / 100 / 96 / 100 | 3.7 s | 99–100 / 100 / 96 / 100 |
| `/hizmet-bolgeleri/ankara/` | 89–93 / 100 / 100 / 100 | 3.1–3.7 s | 100 / 100 / 100 / 100 |

TBT 20–80 ms, CLS 0 (tüm sayfalar).

**Değerlendirme:** Erişilebilirlik ve SEO hedefleri (≥95) karşılandı. Mobil performans hedefi (≥90) bir sayfada karşılandı, diğerlerinde 85–89. Mobil LCP, Lighthouse'un simülasyonunda (yavaş 4G + 4× CPU) ilk boyamadan önce yüklenen Next/React çalışma zamanı JavaScript'inden kaynaklanıyor; gerçek ölçümde LCP = FCP ≈ 1.4 s. Denenen ve sonucu değiştirmeyen düzenlemeler: değişken font + ön yükleme azaltımı, mobil menüde Radix yerine yerleşik `<dialog>`, CSS'in HTML'e gömülmesi (geri alındı). Canlıda HTTP/2 + brotli ile tekrar ölçülmeli; gerekirse bir sonraki adım header'daki istemci bileşenlerinin küçültülmesi. "Proje Teklifi" sayfasında BP 96: konsoldaki tarayıcı uyarısı (inspector-issues), işlevsel sorun değil.

## Erişilebilirlik

axe-core (WCAG 2.0/2.1/2.2 A+AA), 13 sayfa × açık/koyu tema: **0 ihlal**. Düzeltilenler: açık temada ikincil metin kontrastı (4.47 → 5.3:1), 404 sayfası başlığı.

## Güvenlik

Ayrıntı: [security-checklist.md](security-checklist.md). `npm audit --omit=dev`: 0 açık.

## Canlıya geçmeden yapılması gerekenler

1. VPS erişimi → [deployment.md](deployment.md) §0 envanter → ilk deploy (betikler ilk kez gerçek ortamda çalışacak; ilk çalıştırmayı birlikte izlemek önerilir)
2. SMTP bilgileri → test e-postası → teklif bildirim zinciri
3. İlk yönetici hesabı (`npm run admin:create`) + 2FA; `qa-admin@lagen.test` test hesabının silinmesi
4. Müşteri içerikleri: vektör logo, unvan, tam adres (bina no/posta kodu, "Bayram Çıtak Sokak – Harbiye" teyidi), çalışma saatleri, izinli projeler ve yorumlar, bütçe aralıkları
5. Yasal metinlerin hukuki onayı (onay sonrası "Hukuki onay bekliyor" işareti kaldırılır)
6. Blog taslakları ve Çankaya bölge sayfası: uzman incelemesi, `[KAYNAK]` işaretlerinin giderilmesi
7. DNS geçişi, Search Console (doğrulama + sitemap), analitik kararı (GA4/Umami) ve çerez metninin buna göre güncellenmesi
8. Canlı ortamda Lighthouse/PageSpeed ve Rich Results Test
