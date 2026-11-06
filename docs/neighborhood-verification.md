# Ankara Semt / Mahalle Doğrulaması

> Tarih: 2026-11-04. Amaç: yerel SEO sayfalarında yanlış idari eşleştirme yayınlamamak.
> Bu belge bir araştırma çıktısıdır. Muhtar adları ve telefon numaraları bilerek alınmadı.

## Yöntem

1. **Birincil resmî kaynak:** Ankara Büyükşehir Belediyesi "Muhtarlar" sayfaları, ilçe bazında (`ankara.bel.tr/muhtarlar/<ilce>`). Çankaya için 3 sayfanın tamamı tarandı (124 mahalle). Yenimahalle için 2 sayfa tarandı (57 mahalle kaydı). Etimesgut ve Gölbaşı listelerinde aranan adlar kontrol edildi.
2. **İkinci resmî kaynak (çapraz kontrol):**
   - Çankaya Belediyesi "Muhtarlarımız" sayfası (124 mahalle).
   - Etimesgut Kaymakamlığı 2024 muhtar listesi PDF'i (38 mahalle).
   - Yenimahalle Kaymakamlığı 2024 muhtar listesi PDF'i.
3. **OSB'ler:** ostim.org.tr ana sayfasındaki JSON-LD adresine bakıldı. İvedik OSB'nin resmî sitesine erişilemedi (`ivedik.org.tr` çözümlenmiyor, `ivedikosb.org.tr` 403 döndü).
4. **Destekleyici kaynak (resmî değil):** Wikipedia ilçe maddeleri. Bunlar e-icisleri.gov.tr'deki 2023 mahalle envanterine atıf yapıyor. Bunlar yalnızca çapraz kontrol için kullanıldı ve tek başına `verified=true` için yeterli sayılmadı.
5. **Kural:** Resmî bir listede birebir aynı adla bulunan kayıt `neighborhood` olarak işaretlendi. Resmî listede bulunmayan semt, ticari bölge veya OSB `zone` olarak işaretlendi. Bir semtin hangi mahallelere denk geldiğini gösteren resmî bir kaynak bulunamadıysa bu eşleştirme "doğrulanamadı" olarak bırakıldı.

### Önemli uyarılar

- **`golbasi.bel.tr` ve `golbasi.gov.tr` Ankara'ya ait değil, Adıyaman Gölbaşı'na aittir.** `golbasi.bel.tr` muhtar sayfasında Mimar Sinan ve Kurugeçit gibi mahalleler var. `golbasi.gov.tr` sayfasının adresi "Gölbaşı /Adıyaman". Ankara Gölbaşı Kaymakamlığı'nın adresi `ankaragolbasi.gov.tr`. Bu siteler kaynak veya `sameAs` olarak kullanılmamalı.
- Çankaya'da **"Dikmen" adında bir mahalle yok.** Resmî listede yalnızca **Yukarı Dikmen** var. Wikipedia'daki listede "Aşağı Dikmen" geçiyor, ancak güncel ABB ve Çankaya Belediyesi listelerinde bu mahalle yok.
- "Oran" adının resmî yazımı **"Or-An"**.
- Yenimahalle'deki mahalle adı **"İvedik"**. Wikipedia/e-icisleri 2023 kaydında bu mahalle "İvedikköy" olarak geçiyor. İvedik **OSB** ile İvedik **Mahallesi** aynı şey değil.
- Brief'teki "Çukurambar = Kızılırmak" varsayımı doğru değil. **Çukurambar kendi başına resmî bir mahalle.** Kızılırmak Mahallesi de ayrı bir mahalle olarak var.

## Sonuç tablosu

| Ad | Nitelik | İlçe | Resmî mahalle karşılığı | Kaynak | Güven | Not |
|---|---|---|---|---|---|---|
| Kızılay | neighborhood | Çankaya | Kızılay | ABB muhtarlar/cankaya; Çankaya Bld. muhtarlarımız | Yüksek | Resmî mahalle. "Kızılay" adı halk dilinde daha geniş bir merkez bölgesi için de kullanılır. Sayfa metni mahalleyi esas almalı. |
| Çukurambar | neighborhood | Çankaya | Çukurambar | ABB; Çankaya Bld. | Yüksek | Kızılırmak ayrı bir mahalledir. Semtin Kızılırmak'a taştığı yönünde resmî bir kaynak bulunamadı. |
| Söğütözü | neighborhood | Çankaya | Söğütözü | ABB; Çankaya Bld. | Yüksek | — |
| Balgat | neighborhood | Çankaya | Balgat | ABB; Çankaya Bld. | Yüksek | — |
| Ayrancı | neighborhood | Çankaya | Ayrancı | ABB; Çankaya Bld. | Yüksek | — |
| Bahçelievler | neighborhood | Çankaya | Bahçelievler (ayrıca Yukarı Bahçelievler var) | ABB; Çankaya Bld. | Yüksek | Gölbaşı'nda da "Bahçelievler" adlı bir mahalle var. Sayfada ilçe adı mutlaka belirtilmeli. |
| Dikmen | zone | Çankaya | Yukarı Dikmen (resmî). Semtin tam karşılığı doğrulanamadı. | ABB; Çankaya Bld. | Orta | "Dikmen" adında bir mahalle yok. Harbiye gibi komşu mahallelerin Dikmen semtine dahil olup olmadığı resmî kaynakla doğrulanamadı. |
| Oran | neighborhood | Çankaya | Or-An | ABB; Çankaya Bld. | Yüksek | Resmî yazım "Or-An". Schema ve adres alanlarında bu yazım kullanılmalı. |
| Çayyolu | neighborhood | Çankaya | Çayyolu | ABB; Çankaya Bld. | Yüksek | Halk dilindeki "Çayyolu" bölgesi daha geniş olabilir. Bu, resmî kaynakla doğrulanamadı. |
| Ümitköy | zone | Çankaya | Ümit (ana karşılık). Semtin tam sınırı doğrulanamadı. | ABB; Çankaya Bld. | Orta | Resmî listede "Ümitköy" yok, "Ümit" var. |
| Ostim | neighborhood (+ OSB) | Yenimahalle | Ostim | ABB muhtarlar/yenimahalle; Yenimahalle Kaym. 2024 PDF; ostim.org.tr JSON-LD | Yüksek | Ostim Mahallesi resmîdir. OSTİM OSB ayrı bir kurumdur ve JSON-LD'de addressLocality "Yenimahalle" olarak geçer. OSB'nin yalnızca bu mahalleyle sınırlı olup olmadığı doğrulanamadı. |
| İvedik | zone (OSB) / ayrıca mahalle | Yenimahalle | Resmî bir İvedik Mahallesi var. İvedik OSB'nin hangi mahalle(ler)de olduğu doğrulanamadı. | ABB; Yenimahalle Kaym. 2024 PDF | Orta | İvedik OSB'nin resmî sitesine erişilemedi. OSB'nin Yenimahalle'de olduğunu basın kaynakları söylüyor. Başka ilçelere taşıp taşmadığı **doğrulanamadı**. Sayfa OSB'yi hedefliyorsa "İvedik Mahallesi" ile eşlenmemeli. |
| Batıkent | zone | Yenimahalle | Doğrulanamadı | ABB muhtarlar/yenimahalle ("Batıkent" listede yok) | Orta (ilçe) / Düşük (mahalle) | Resmî mahalle değil. Resmî olmayan kaynaklarda Kentkoop, Yenibatı, Batı Sitesi ve Uğur Mumcu gibi adlarla birlikte anılıyor. Bu eşleştirme yayınlanmamalı. |
| Bağlıca | neighborhood | Etimesgut | Bağlıca (ayrıca Yeni Bağlıca var) | ABB muhtarlar/etimesgut; Etimesgut Kaym. 2024 PDF | Yüksek | Yeni Bağlıca, Bağlıca'nın bölünmesiyle oluşturuldu. |
| Eryaman | neighborhood | Etimesgut | Eryaman | ABB; Etimesgut Kaym. 2024 PDF | Yüksek | Halk dilindeki "Eryaman" bölgesi birkaç mahalleye yayılıyor olabilir. Bu doğrulanamadı. |
| İncek | neighborhood | Gölbaşı | İncek | ABB muhtarlar/golbasi; ABB proje sayfası (İncek Mahallesi park) | Yüksek | golbasi.bel.tr ve golbasi.gov.tr Adıyaman'a ait. Bu siteler kullanılmamalı. |
| Harbiye (ofis adresi) | neighborhood | Çankaya | Harbiye | ABB; Çankaya Bld. | Yüksek | Harbiye, Çankaya'da resmî bir mahalle. Muhtarlığı Hürriyet Caddesi'nde, Aşık Veysel Parkı'nda. Adresteki "Dikmen" resmî bir mahalle değil, semt adı. Harbiye'nin Dikmen semtinde olması yaygın bir kullanım, ancak resmî kaynakla doğrulanamadı. "Bayram Çıtak Sokak"ın Harbiye'de olduğu **doğrulanamadı** (AKS/UAVT'den teyit edilmeli). |

### Ofis adresi önerisi

Schema ve NAP için şu yazım önerilir: `Harbiye Mahallesi, Bayram Çıtak Sokak, Çankaya / Ankara`. Gerekirse "Dikmen" `addressLocality` yerine yalnızca metinde semt olarak kullanılabilir. Sokak adı e-Devlet "Adres Bilgilerim" veya müşterinin ikametgâh/vergi levhası belgesiyle teyit edilmelidir.

## Kaynaklar

- ABB Muhtarlar, Çankaya: https://www.ankara.bel.tr/muhtarlar/cankaya (sayfa 1–3)
- ABB Muhtarlar, Yenimahalle: https://www.ankara.bel.tr/muhtarlar/yenimahalle (sayfa 1–2)
- ABB Muhtarlar, Etimesgut: https://www.ankara.bel.tr/muhtarlar/etimesgut
- ABB Muhtarlar, Gölbaşı: https://www.ankara.bel.tr/muhtarlar/golbasi
- ABB, Gölbaşı İncek Mahallesi Park Alanı: https://www.ankara.bel.tr/proje/golbasi-incek-mahallesi-park-alani-275
- Çankaya Belediyesi, Muhtarlarımız: https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz
- Etimesgut Kaymakamlığı, 2024 muhtar listesi: http://www.etimesgut.gov.tr/kurumlar/etimesgut.gov.tr/18032024/2024-Muhtarlar-Telefon.pdf
- Yenimahalle Kaymakamlığı, 2024 muhtar listesi: https://www.yenimahalle.gov.tr/kurumlar/yenimahalle.gov.tr/yenimahalle/DERYA/muhtar/muhtarlar2024/2024-muhtar-listesi.pdf
- OSTİM OSB: https://www.ostim.org.tr (JSON-LD: "100. Yıl Bulvarı No:101/A 06374 OSTİM/Ankara", addressLocality "Yenimahalle")
- Destekleyici (resmî değil): https://en.wikipedia.org/wiki/%C3%87ankaya_District, https://en.wikipedia.org/wiki/Yenimahalle, https://en.wikipedia.org/wiki/Etimesgut, https://en.wikipedia.org/wiki/G%C3%B6lba%C5%9F%C4%B1,_Ankara

## JSON

```json
[
  {"name": "Kızılay", "slug": "kizilay", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Kızılay"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Çukurambar", "slug": "cukurambar", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Çukurambar"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Söğütözü", "slug": "sogutozu", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Söğütözü"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Balgat", "slug": "balgat", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Balgat"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Ayrancı", "slug": "ayranci", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Ayrancı"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Bahçelievler", "slug": "bahcelievler", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Bahçelievler"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Dikmen", "slug": "dikmen", "kind": "zone", "district": "cankaya", "officialNames": ["Yukarı Dikmen"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "medium", "verified": false},
  {"name": "Oran", "slug": "oran", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Or-An"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Çayyolu", "slug": "cayyolu", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Çayyolu"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true},
  {"name": "Ümitköy", "slug": "umitkoy", "kind": "zone", "district": "cankaya", "officialNames": ["Ümit"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "medium", "verified": false},
  {"name": "Ostim", "slug": "ostim", "kind": "neighborhood", "district": "yenimahalle", "officialNames": ["Ostim"], "sources": ["https://www.ankara.bel.tr/muhtarlar/yenimahalle", "https://www.yenimahalle.gov.tr/kurumlar/yenimahalle.gov.tr/yenimahalle/DERYA/muhtar/muhtarlar2024/2024-muhtar-listesi.pdf", "https://www.ostim.org.tr"], "confidence": "high", "verified": true},
  {"name": "İvedik", "slug": "ivedik", "kind": "zone", "district": "yenimahalle", "officialNames": [], "sources": ["https://www.ankara.bel.tr/muhtarlar/yenimahalle", "https://www.yenimahalle.gov.tr/kurumlar/yenimahalle.gov.tr/yenimahalle/DERYA/muhtar/muhtarlar2024/2024-muhtar-listesi.pdf"], "confidence": "medium", "verified": false},
  {"name": "Batıkent", "slug": "batikent", "kind": "zone", "district": "yenimahalle", "officialNames": [], "sources": ["https://www.ankara.bel.tr/muhtarlar/yenimahalle"], "confidence": "low", "verified": false},
  {"name": "Bağlıca", "slug": "baglica", "kind": "neighborhood", "district": "etimesgut", "officialNames": ["Bağlıca"], "sources": ["https://www.ankara.bel.tr/muhtarlar/etimesgut", "http://www.etimesgut.gov.tr/kurumlar/etimesgut.gov.tr/18032024/2024-Muhtarlar-Telefon.pdf"], "confidence": "high", "verified": true},
  {"name": "Eryaman", "slug": "eryaman", "kind": "neighborhood", "district": "etimesgut", "officialNames": ["Eryaman"], "sources": ["https://www.ankara.bel.tr/muhtarlar/etimesgut", "http://www.etimesgut.gov.tr/kurumlar/etimesgut.gov.tr/18032024/2024-Muhtarlar-Telefon.pdf"], "confidence": "high", "verified": true},
  {"name": "İncek", "slug": "incek", "kind": "neighborhood", "district": "golbasi", "officialNames": ["İncek"], "sources": ["https://www.ankara.bel.tr/muhtarlar/golbasi", "https://www.ankara.bel.tr/proje/golbasi-incek-mahallesi-park-alani-275"], "confidence": "high", "verified": true},
  {"name": "Harbiye", "slug": "harbiye", "kind": "neighborhood", "district": "cankaya", "officialNames": ["Harbiye"], "sources": ["https://www.ankara.bel.tr/muhtarlar/cankaya", "https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz"], "confidence": "high", "verified": true}
]
```

Notlar (JSON):
- `İvedik` kaydı OSB/bölge anlamında. Resmî bir "İvedik" mahallesi de var (Yenimahalle). OSB'yi bu mahalleyle eşlemek doğrulanmadığı için `officialNames` boş bırakıldı.
- `Dikmen` ve `Ümitköy` kayıtlarında `officialNames` içindeki adlar resmî ve doğrulanmış mahallelerdir. Ancak semtin bu mahalleyle tam örtüştüğü doğrulanmadığı için `verified=false`.
- `Ostim` kaydının `verified=true` olması **mahalle** için geçerli. OSB'nin sınırları ayrıca doğrulanmadı.
