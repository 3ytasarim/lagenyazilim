/**
 * İlk içerik dalgası TASLAKLARI (docs/content-matrix.md). Hepsi status=draft olarak eklenir;
 * uzman incelemesi, gerçek deneyim/örnek ve kaynak eklenmeden yayımlanmamalıdır.
 * [KAYNAK] işareti olan yazılar yayın kontrolünden geçemez.
 */
export type DraftPost = { slug: string; title: string; excerpt: string; category: string; html: string; seoTitle: string; seoDescription: string };

const note = (t: string) => `<div data-callout="info" class="callout callout-info"><p><strong>Taslak notu:</strong> ${t}</p></div>`;

export const DRAFT_POSTS: DraftPost[] = [
  {
    slug: "ankarada-web-sitesi-yaptirirken-nelere-dikkat-edilmeli",
    title: "Ankara'da profesyonel web sitesi yaptırırken nelere dikkat edilmeli?",
    excerpt: "Teklifleri karşılaştırmadan önce netleştirmeniz gereken hedefler, sormanız gereken sorular ve sözleşmede bulunması gereken maddeler.",
    category: "web-tasarim",
    seoTitle: "Web Sitesi Yaptırırken Dikkat Edilmesi Gerekenler",
    seoDescription: "Web sitesi yaptırmadan önce hedefinizi, kapsamı ve teklifleri nasıl değerlendireceğinizi anlatan kontrol listesi: içerik, SEO altyapısı, panel, sahiplik.",
    html: `${note("Gerçek proje örnekleri ve ekibin deneyiminden notlar eklenmeli.")}
<p>Web sitesi teklifleri arasında büyük fiyat farkları görmenin nedeni çoğu zaman kapsamın farklı anlaşılmasıdır. Karşılaştırmayı doğru yapmak için önce ne istediğinizi yazılı hale getirmeniz gerekir.</p>
<h2>1. Sitenin işi ne olacak?</h2>
<p>"Kurumsal bir site" bir hedef değildir. Teklif talebi toplamak, bayilere ürün bilgisi sunmak, işe alım yapmak ya da yurt dışı alıcılara güven vermek farklı yapılar gerektirir. Ölçülebilir bir hedef belirleyin: örneğin aylık teklif formu sayısı.</p>
<h2>2. İçeriği kim hazırlayacak?</h2>
<ul><li>Metinler ve görseller hazır mı, yoksa ajanstan mı bekleniyor?</li><li>Ürün veya hizmet bilgisi güncel mi?</li><li>Fotoğraflar sizin mi, stok mu?</li></ul>
<p>İçerik gecikmesi, projelerin takvimden sapmasının en yaygın nedenidir.</p>
<h2>3. Teklifte mutlaka sorun</h2>
<ul><li>Site kendi tasarımınız mı, hazır tema mı olacak?</li><li>İçeriği kendiniz güncelleyebileceğiniz bir panel var mı?</li><li>Alan adı, sunucu ve kaynak dosyalar kimin adına kaydedilecek?</li><li>Eski siteniz varsa URL'ler için yönlendirme planı yapılacak mı?</li><li>Yayından sonra bakım ve destek nasıl işleyecek?</li></ul>
<h2>4. Teknik altyapıda aranacaklar</h2>
<p>Mobil uyum, hız, temel SEO ayarları (başlık, açıklama, site haritası), erişilebilirlik ve güvenlik güncellemeleri teklifte açıkça yer almalı.</p>
<h2>Kontrol listesi</h2>
<ol><li>Hedef ve ölçüm yöntemi yazıldı</li><li>Sayfa listesi çıkarıldı</li><li>İçerik sorumluluğu belirlendi</li><li>Sahiplik ve erişim maddeleri sözleşmede</li><li>Yayın sonrası destek kapsamı net</li></ol>`,
  },
  {
    slug: "kurumsal-web-sitesi-maliyetini-belirleyen-faktorler",
    title: "Kurumsal web sitesi maliyetini hangi faktörler belirler?",
    excerpt: "Sayfa sayısından entegrasyonlara, içerik üretiminden bakım planına kadar web sitesi bütçesini etkileyen kalemler.",
    category: "web-tasarim",
    seoTitle: "Kurumsal Web Sitesi Maliyetini Belirleyen Faktörler",
    seoDescription: "Kurumsal web sitesi fiyatı neye göre değişir? Tasarım, sayfa sayısı, dil, entegrasyon, içerik, yönetim paneli ve bakım maliyetlerini karşılaştırın.",
    html: `${note("Fiyat aralığı verilmemeli; yalnızca etkenler anlatılmalı. Firma fiyatlandırma yaklaşımı onaylanmalı.")}
<p>Web sitesi maliyeti tek bir rakamla ifade edilemez; aynı "5 sayfalık site" ifadesi bambaşka işleri anlatabilir. Bütçeyi belirleyen başlıca kalemler şunlardır.</p>
<h2>Tasarım yaklaşımı</h2><p>Hazır tema uyarlaması ile markaya özel tasarım arasında hem süre hem kalite farkı vardır.</p>
<h2>Sayfa ve şablon sayısı</h2><p>Maliyeti sayfa adedinden çok, farklı şablon sayısı belirler: ana sayfa, hizmet şablonu, blog, iletişim gibi.</p>
<h2>Dil seçenekleri</h2><p>Her dil, içerik çevirisi ve teknik ayar (hreflang, ayrı URL yapısı) gerektirir.</p>
<h2>Entegrasyonlar</h2><ul><li>CRM, ERP veya muhasebe bağlantısı</li><li>Ödeme altyapısı</li><li>Randevu veya teklif sistemleri</li></ul>
<h2>İçerik üretimi</h2><p>Metin yazımı, fotoğraf çekimi ve görsel hazırlık ayrı kalemlerdir ve genellikle göz ardı edilir.</p>
<h2>Bakım ve barındırma</h2><p>Güvenlik güncellemeleri, yedekleme ve sunucu maliyeti yayından sonra devam eder.</p>
<h2>Teklifleri karşılaştırırken</h2><p>Kalemleri aynı tabloya yazın ve her teklifte neyin dahil olduğunu işaretleyin.</p>`,
  },
  {
    slug: "ozel-yazilim-mi-hazir-yazilim-mi",
    title: "Özel yazılım mı, hazır yazılım mı? Karar tablosu",
    excerpt: "İş süreçleriniz için hazır bir ürün mü kullanmalı, yoksa özel yazılım mı geliştirmelisiniz? Maliyet, esneklik ve risk açısından karşılaştırma.",
    category: "yazilim",
    seoTitle: "Özel Yazılım mı Hazır Yazılım mı? Karar Tablosu",
    seoDescription: "Hazır yazılım ile özel yazılım arasında seçim yaparken süreç uyumu, lisans maliyeti, entegrasyon ve sahiplik kriterlerini karşılaştıran karar tablosu.",
    html: `${note("Gerçek proje deneyiminden bir örnek (müşteri izniyle) eklenebilir.")}
<p>Doğru seçim, sürecinizin ne kadar standart olduğuna ve yazılımın rekabet avantajınızın parçası olup olmadığına bağlıdır.</p>
<h2>Karar tablosu</h2>
<table><thead><tr><th>Kriter</th><th>Hazır yazılım</th><th>Özel yazılım</th></tr></thead><tbody><tr><td>Başlangıç süresi</td><td>Kısa</td><td>Analiz ve geliştirme gerekir</td></tr><tr><td>Süreç uyumu</td><td>Sürecinizi ürüne uydurursunuz</td><td>Yazılım sürecinize uyar</td></tr><tr><td>Maliyet yapısı</td><td>Kullanıcı başı lisans</td><td>Geliştirme + bakım</td></tr><tr><td>Entegrasyon</td><td>Ürünün izin verdiği kadar</td><td>İhtiyaca göre</td></tr><tr><td>Sahiplik</td><td>Sağlayıcıda</td><td>Sözleşmeye göre sizde</td></tr></tbody></table>
<h2>Hazır yazılım ne zaman doğru?</h2><ul><li>Süreç sektörde standartsa</li><li>Kullanıcı sayısı az ve sabitse</li><li>Hızlı başlamak öncelikse</li></ul>
<h2>Özel yazılım ne zaman doğru?</h2><ul><li>Birden fazla sistemi birbirine bağlamanız gerekiyorsa</li><li>Süreciniz sizi rakiplerinizden ayırıyorsa</li><li>Lisans maliyeti kullanıcı sayısıyla hızla artıyorsa</li></ul>
<h2>Ara yol</h2><p>Hazır bir ürünü çekirdek olarak kullanıp eksik kalan akışlar için küçük özel modüller geliştirmek çoğu zaman en dengeli seçenektir.</p>`,
  },
  {
    slug: "seo-ajansi-secerken-sorulmasi-gereken-sorular",
    title: "SEO ajansı seçerken sorulması gereken 12 soru",
    excerpt: "Garanti vaatlerinden raporlamaya, bağlantı stratejisinden erişim yetkilerine: SEO hizmeti almadan önce netleştirmeniz gerekenler.",
    category: "seo",
    seoTitle: "SEO Ajansı Seçerken Sorulması Gereken 12 Soru",
    seoDescription: "SEO ajansıyla çalışmaya başlamadan önce sorulacak 12 soru: garanti, raporlama, teknik denetim, içerik, backlink yöntemi ve hesap sahipliği.",
    html: `${note("Sorular ajansın kendi çalışma yöntemiyle tutarlı olmalı; ekip incelemeli.")}
<ol>
<li><strong>İlk ay ne yapacaksınız?</strong> Somut bir denetim ve öncelik listesi bekleyin.</li>
<li><strong>Sıralama garantisi veriyor musunuz?</strong> Arama sonuçlarını kimse kontrol edemez; garanti vaadi bir uyarı işaretidir.</li>
<li><strong>Hangi verilerle ölçeceksiniz?</strong> Search Console ve analitik verisi kullanılmalı.</li>
<li><strong>Raporlar ne sıklıkla ve hangi içerikle gelecek?</strong></li>
<li><strong>Teknik sorunları kim düzeltecek?</strong> Ajans mı, sizin yazılım ekibiniz mi?</li>
<li><strong>İçerik kim yazacak ve kim onaylayacak?</strong></li>
<li><strong>Bağlantı (backlink) kazanımını nasıl yapıyorsunuz?</strong> Satın alınan bağlantılar Google yönergelerine aykırıdır.</li>
<li><strong>Yerel SEO ve Google Business Profile dahil mi?</strong></li>
<li><strong>Hesaplar kimin adına açılacak?</strong> Search Console ve Analytics mülkleri sizde olmalı.</li>
<li><strong>Çalışmayı bitirirsek ne olur?</strong> Yapılan değişiklikler ve içerikler sizde kalmalı.</li>
<li><strong>Benzer bir işletmeyle çalıştınız mı?</strong> İzinli bir örnek isteyin.</li>
<li><strong>Yapay zekâ destekli aramalara nasıl hazırlanıyorsunuz?</strong></li>
</ol>`,
  },
  {
    slug: "google-ads-ve-seo-farklari",
    title: "Google Ads ve SEO: farklar ve ne zaman hangisi?",
    excerpt: "Ücretli reklam ile organik görünürlük arasında süre, maliyet ve kalıcılık açısından farklar; iki kanalın birlikte nasıl kullanılabileceği.",
    category: "dijital-pazarlama",
    seoTitle: "Google Ads ve SEO Arasındaki Farklar",
    seoDescription: "Google Ads ile SEO'yu süre, maliyet, kalıcılık ve ölçüm açısından karşılaştırın; hangi durumda hangisinin öne çıktığını ve birlikte kullanımını öğrenin.",
    html: `${note("Google Ads hizmetinin firmada aktif olarak sunulup sunulmadığı teyit edilmeli.")}
<h2>Temel fark</h2><p>Google Ads'te görünürlük için tıklama başına ödeme yaparsınız ve bütçe durduğunda görünürlük biter. SEO'da görünürlük, sitenin içeriği ve teknik yapısıyla kazanılır; sonuçlar daha geç gelir ama kalıcıdır.</p>
<table><thead><tr><th></th><th>Google Ads</th><th>SEO</th></tr></thead><tbody><tr><td>Sonuç süresi</td><td>Kampanya açılır açılmaz</td><td>Aylar içinde</td></tr><tr><td>Maliyet</td><td>Tıklama başına</td><td>Emek ve içerik</td></tr><tr><td>Kalıcılık</td><td>Bütçeyle sınırlı</td><td>Birikimli</td></tr><tr><td>Test</td><td>Mesaj ve sayfa hızla denenir</td><td>Daha yavaş</td></tr></tbody></table>
<h2>Ne zaman reklam?</h2><ul><li>Yeni bir hizmeti hızla duyurmak</li><li>Mevsimsel talep</li><li>Hangi anahtar kelimelerin dönüştüğünü test etmek</li></ul>
<h2>Ne zaman SEO?</h2><ul><li>Uzun vadeli, sürekli talep</li><li>Bilgi arayan, karar sürecindeki kullanıcılar</li></ul>
<h2>Birlikte kullanım</h2><p>Reklam verisi hangi sorguların satışa dönüştüğünü gösterir; bu veri SEO içerik planını besler.</p>`,
  },
  {
    slug: "kurumsal-web-sitelerinde-teknik-seo-kontrol-listesi",
    title: "Kurumsal web sitelerinde teknik SEO kontrol listesi",
    excerpt: "Tarama, indeksleme, hız, yapılandırılmış veri ve yönlendirmeler: kendi sitenizde kontrol edebileceğiniz teknik SEO maddeleri.",
    category: "seo",
    seoTitle: "Kurumsal Siteler İçin Teknik SEO Kontrol Listesi",
    seoDescription: "Kurumsal web siteniz için teknik SEO kontrol listesi: robots.txt, sitemap, canonical, yönlendirmeler, hız, mobil uyum, yapılandırılmış veri ve iç bağlantılar.",
    html: `${note("Core Web Vitals eşikleri için resmî Google kaynağı bağlantısı eklenmeli [KAYNAK].")}
<h2>Tarama ve indeksleme</h2><ul><li>robots.txt önemli sayfaları engellemiyor</li><li>XML site haritası yalnızca yayında ve indekslenebilir sayfaları içeriyor</li><li>Search Console'da indeksleme hataları takip ediliyor</li></ul>
<h2>URL ve yönlendirmeler</h2><ul><li>Tek host (www / www'suz) ve HTTPS</li><li>Sonda "/" kullanımı tutarlı</li><li>Kaldırılan sayfalar için 301 veya 410</li><li>Yönlendirme zinciri yok</li></ul>
<h2>Sayfa içi</h2><ul><li>Her sayfada tek ve anlamlı H1</li><li>Tekil başlık ve açıklama</li><li>Kendi adresini gösteren canonical</li><li>Görsellerde alt metin</li></ul>
<h2>Hız ve deneyim</h2><p>Core Web Vitals değerleri (LCP, INP, CLS) iyi aralıkta olmalı [KAYNAK]. Büyük görseller optimize edilmeli, gereksiz üçüncü taraf betikler kaldırılmalı.</p>
<h2>Yapılandırılmış veri</h2><p>Organization, Service ve BreadcrumbList gibi şemalar görünür içerikle tutarlı olmalı; sahte puan veya yorum şeması kullanılmamalı.</p>`,
  },
  {
    slug: "web-sitesi-yenilerken-seo-kaybi-nasil-onlenir",
    title: "Web sitesi yenilerken SEO kaybı nasıl önlenir?",
    excerpt: "Yeni siteye geçişte eski adresleri korumak, yönlendirme haritası hazırlamak ve yayından sonra Search Console'u izlemek için adım adım plan.",
    category: "seo",
    seoTitle: "Web Sitesi Yenilerken SEO Kaybı Nasıl Önlenir?",
    seoDescription: "Site yenilemede trafik kaybını önlemek için URL envanteri, 301 yönlendirme haritası, içerik eşleştirme ve yayın sonrası Search Console takibi.",
    html: `${note("Lagen'in kendi site yenileme sürecinden (eski WordPress → yeni sistem) gerçek notlar eklenebilir.")}
<h2>1. Eski sitenin envanterini çıkarın</h2><p>Site haritası, tarama aracı ve Search Console verisiyle tüm adresleri listeleyin; trafik ve bağlantı alan sayfaları işaretleyin.</p>
<h2>2. Korunacak adresleri belirleyin</h2><p>Değerli sayfaların adresi mümkünse aynen kalmalı.</p>
<h2>3. Yönlendirme haritası</h2><p>Değişen her adres için birebir 301 hazırlayın. Tüm eski adresleri ana sayfaya yönlendirmek kaybı büyütür. Gerçek karşılığı olmayan sayfalar için 410 kullanılabilir.</p>
<h2>4. İçeriği eşleştirin</h2><p>Eski sayfanın cevapladığı sorular yeni sayfada da cevaplanmalı.</p>
<h2>5. Yayın günü</h2><ul><li>Yönlendirmeleri test edin</li><li>Yeni site haritasını Search Console'a gönderin</li><li>robots.txt'nin yanlışlıkla siteyi engellemediğini kontrol edin</li></ul>
<h2>6. İlk haftalar</h2><p>Kapsam raporu, 404 hataları ve sorgu performansını izleyin.</p>`,
  },
  {
    slug: "yapay-zeka-aramalarinda-isletmeler-nasil-anlasilir-olur",
    title: "Yapay zekâ aramalarında işletmeler nasıl daha anlaşılır olur?",
    excerpt: "Google AI Overviews ve sohbet tabanlı asistanlar için içeriği açık, doğrulanabilir ve yapılandırılmış hale getirmenin pratik yolları.",
    category: "seo",
    seoTitle: "Yapay Zekâ Aramalarında İşletmeniz Nasıl Anlaşılır Olur?",
    seoDescription: "Yapay zekâ destekli arama sonuçlarında doğru anlaşılmak için net şirket bilgisi, doğrudan cevaplar, yapılandırılmış veri ve güncel içerik önerileri.",
    html: `${note("Garanti dili kullanılmamalı; AI sonuçlarında görünme vaat edilmemeli. Google'ın AI özellikleri dokümantasyonu kaynak olarak eklenmeli [KAYNAK].")}
<p>Yapay zekâ destekli arama sistemleri, web'deki içerikleri özetleyerek cevap üretir. Bu sistemlerde görünürlük garanti edilemez; ama işletmenizin doğru anlaşılması için yapabilecekleriniz vardır.</p>
<h2>Açık ve tutarlı şirket bilgisi</h2><p>Ad, adres, telefon ve hizmet listesi sitede, Google Business Profile'da ve diğer platformlarda aynı olmalı.</p>
<h2>Soruları doğrudan cevaplayın</h2><p>Her hizmet sayfasının başında "bu hizmet nedir, kime uygundur, neyi kapsar" sorularına kısa bir paragrafla cevap verin.</p>
<h2>Doğrulanabilir içerik</h2><p>Rakamlar ve iddialar için kaynak gösterin; yazar ve güncelleme tarihi belirtin.</p>
<h2>Yapılandırılmış veri</h2><p>Organization, Service ve FAQPage gibi şemalar görünür içerikle tutarlı olarak kullanılmalı.</p>
<h2>Tarayıcılara erişim</h2><p>robots.txt'de arama ve yapay zekâ tarayıcılarını gereksiz yere engellemeyin.</p>`,
  },
  {
    slug: "kucuk-isletmeler-icin-90-gunluk-dijital-pazarlama-plani",
    title: "Küçük işletmeler için 90 günlük dijital pazarlama planı",
    excerpt: "Sınırlı bütçeyle ilk üç ayda kurulması gereken temel: profil, site, içerik ritmi ve ölçüm.",
    category: "dijital-pazarlama",
    seoTitle: "Küçük İşletmeler İçin 90 Günlük Dijital Pazarlama Planı",
    seoDescription: "Küçük işletmeler için üç aylık dijital pazarlama planı: Google Business Profile, web sitesi temelleri, sosyal medya ritmi, ölçüm ve iyileştirme.",
    html: `${note("Plan genel çerçevedir; sektör örnekleri ve ekip deneyimi eklenmeli.")}
<h2>1–30. gün: temel</h2><ul><li>Google Business Profile'ı eksiksiz doldurun</li><li>Web sitesinde iletişim bilgilerini ve hizmetleri netleştirin</li><li>Search Console ve analitik kurulumunu yapın</li></ul>
<h2>31–60. gün: içerik ritmi</h2><ul><li>Müşterilerin en sık sorduğu 5 soruyu sitede cevaplayın</li><li>Sosyal medyada haftalık sabit bir paylaşım düzeni kurun</li><li>Gerçek iş fotoğrafları kullanın</li></ul>
<h2>61–90. gün: ölçüm ve iyileştirme</h2><ul><li>Hangi kanaldan talep geldiğini takip edin</li><li>En çok ziyaret alan sayfaları güncelleyin</li><li>Mutlu müşterilerden izinli yorum isteyin</li></ul>`,
  },
  {
    slug: "sanayi-firmalari-icin-katalog-basili-mi-dijital-mi",
    title: "Sanayi firmaları için katalog: baskı mı, dijital mi?",
    excerpt: "Fuar, bayi ağı ve web sitesi için katalog formatı seçimi; teknik tabloların her iki formatta da okunur kalması.",
    category: "katalog-ve-gorsel",
    seoTitle: "Sanayi Firmaları İçin Katalog: Basılı mı, Dijital mi?",
    seoDescription: "Sanayi ve üretim firmaları için basılı ve dijital katalog karşılaştırması: kullanım yeri, güncelleme, maliyet ve teknik tablo düzeni.",
    html: `${note("Gerçek katalog projesinden (izinli) görsel ve süreç notu eklenmeli.")}
<h2>Kullanım yerine göre seçim</h2><table><thead><tr><th>Kullanım</th><th>Basılı</th><th>Dijital (PDF / web)</th></tr></thead><tbody><tr><td>Fuar ve ziyaret</td><td>Güçlü</td><td>Destekleyici</td></tr><tr><td>Bayi ve satış ekibi</td><td>Sınırlı güncellenir</td><td>Hızla güncellenir</td></tr><tr><td>Yurt dışı alıcı</td><td>Gönderim gerekir</td><td>Anında paylaşılır</td></tr><tr><td>Arama motorları</td><td>Yok</td><td>Web kataloğu aranabilir</td></tr></tbody></table>
<h2>Tek kaynak, iki çıktı</h2><p>Ürün bilgisini tek bir listede tutup hem baskı dosyasını hem dijital sürümü bu kaynaktan üretmek, güncel olmayan katalog sorununu azaltır.</p>
<h2>Teknik tablolar</h2><p>Ürün kodu, ölçü ve malzeme gibi bilgiler sabit sütun düzeninde, okunaklı punto ile verilmeli.</p>`,
  },
];

export const CANKAYA_DRAFT = {
  title: "Çankaya",
  h1: "Çankaya'daki işletmeler için web, yazılım ve dijital pazarlama",
  intro:
    "Ofisimiz Çankaya'nın Harbiye Mahallesi'nde. Çankaya'daki işletmelerle keşif ve sunum toplantılarını ofisimizde ya da kendi işyerlerinde yüz yüze yapabiliyor; ara onayları çevrim içi yürütüyoruz. Fotoğraf ve tesis çekimi gibi yerinde yapılması gereken işler için ilçe içinde kısa sürede ulaşabiliyoruz.",
  localNeeds:
    "Çankaya; kamu kurumları, danışmanlık ve hukuk büroları, sağlık kuruluşları ve iş merkezlerindeki ofislerin yoğun olduğu bir ilçe. Bu yapıdaki işletmelerin dijitalde en sık ihtiyaç duyduğu şeyler, uzmanlığını güvenilir biçimde anlatan bir kurumsal site, ön görüşme veya teklif talebini kolaylaştıran formlar ve ilçe adıyla yapılan aramalarda görünür olmaktır. Kurumsal müşterilere hizmet veren firmalar için ayrıca İngilizce sayfalar ve ihale/tedarikçi dosyalarında kullanılabilecek düzenli bir kurumsal sunum önemlidir. [KAYNAK: ilçedeki sektör yoğunluğu için resmî veri veya ekip deneyimi eklenecek]",
  localSectors:
    "İlçede Kızılay, Söğütözü, Çukurambar ve Balgat gibi resmî mahalleler iş merkezleri ve ofis binalarıyla öne çıkar. Bu bölgelerde çalışan işletmelerin önemli bir kısmı B2B hizmet verir; karar süreçleri uzundur ve web sitesi çoğu zaman ilk araştırma noktasıdır.",
  serviceModel:
    "Çankaya'daki projelerde süreç genellikle ofisimizde veya işyerinizde yapılan bir keşif toplantısıyla başlar. Tasarım sunumları yüz yüze, ara onaylar çevrim içi yapılır. Yayından sonra eğitim ve destek için de aynı düzen geçerlidir.",
  faqs: [
    { q: "Çankaya'daki ofisinize toplantı için gelebilir miyiz?", a: "Evet. Ofisimiz Harbiye Mahallesi'nde; randevu alarak keşif veya sunum toplantısı için gelebilirsiniz." },
    { q: "İşyerimizde toplantı yapabilir misiniz?", a: "Evet. Çankaya içindeki işyerlerinde yüz yüze toplantı yapabiliyoruz; süreç analizi gereken yazılım projelerinde bu tercih ediliyor." },
    { q: "Yazılım projelerinde süreç analizini nerede yapıyorsunuz?", a: "Çankaya içindeki işyerlerinde, ekibin günlük iş akışını yerinde görerek yapıyoruz; gerekirse ara toplantıları çevrim içi sürdürüyoruz." },
  ],
  seoTitle: "Çankaya Web Tasarım ve Dijital Çözümler | Lagen Yazılım",
  seoDescription: "Çankaya'daki işletmeler için web tasarım, özel yazılım ve SEO çözümleri. Harbiye'deki ofisimizde veya işyerinizde görüşelim.",
};
