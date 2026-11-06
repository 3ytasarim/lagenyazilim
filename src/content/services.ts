import type { Service } from "@/types/content";

/**
 * Ana hizmetler — Sprint 2'de `services` tablosunun seed kaynağı.
 * Metinlerde doğrulanmamış rakam, süre veya fiyat taahhüdü yer almaz.
 */
export const SERVICES: Service[] = [
  {
    slug: "ankara-web-tasarim",
    name: "Web Tasarım",
    shortName: "Web Tasarım",
    h1: "Kurumsal Web Tasarım ve Web Sitesi Yaptırma",
    summary: "Hızlı açılan, mobilde rahat kullanılan ve ziyaretçiyi teklif isteğine yönlendiren kurumsal web siteleri.",
    heroText:
      "Web siteniz çoğu zaman bir müşterinin sizinle ilk karşılaşması. Bu yüzden önce kime, neyi, hangi sırayla anlatacağımızı planlıyor; tasarımı, yazılımı ve arama motoru altyapısını aynı plana göre kuruyoruz.",
    shortAnswer:
      "Lagen Yazılım, Türkiye genelindeki işletmeler için kurumsal web sitesi tasarlar ve geliştirir. Süreç ihtiyaç analiziyle başlar; site haritası, içerik yapısı, arayüz tasarımı, yazılım, SEO altyapısı ve yayın sonrası bakım aynı ekip tarafından yürütülür. Teslim edilen site yönetim paneliyle gelir; içerikleri teknik bilgi gerekmeden güncelleyebilirsiniz.",
    icon: "layout",
    problem:
      "Pek çok kurumsal site hazır bir temanın üzerine metin eklenerek yapılıyor. Sonuç tanıdık: yavaş açılan sayfalar, mobilde kayan menüler, hiçbir şey söylemeyen başlıklar ve ziyaretçinin bir sonraki adımı bulamadığı bir yapı. Böyle bir site trafik alsa bile talep üretmez; arama motorlarında da hak ettiği yeri bulamaz.",
    approach:
      "Tasarıma ekran çizerek değil, sorularla başlıyoruz: Siteyi kim ziyaret edecek, hangi soruyla gelecek, sizi neden seçmeli ve sonunda ne yapmasını istiyorsunuz? Bu cevaplardan site haritası ve sayfa kurgusu çıkar. Görsel dil markanızdan beslenir; yazılım tarafında ise hız, erişilebilirlik ve arama motoru uyumu sonradan eklenen ayarlar değil, başlangıçtan itibaren mimarinin parçasıdır.",
    scope: [
      { title: "İhtiyaç analizi ve site haritası", text: "Hedef kitle, rakip siteler ve iş hedefleriniz üzerinden sayfa yapısı ve içerik planı." },
      { title: "Arayüz ve deneyim tasarımı", text: "Masaüstü ve mobil için ayrı düşünülmüş, markanıza özgü sayfa tasarımları." },
      { title: "Yazılım ve yönetim paneli", text: "Sayfaları, hizmetleri, blog yazılarını ve görselleri kendiniz güncelleyebileceğiniz panel." },
      { title: "SEO altyapısı", text: "Başlık ve açıklama yönetimi, yapılandırılmış veri, site haritası, temiz URL yapısı." },
      { title: "Performans ve erişilebilirlik", text: "Görsel optimizasyonu, hızlı ilk yükleme, klavye ve ekran okuyucu uyumu." },
      { title: "Yayın, taşıma ve bakım", text: "Alan adı ve sunucu kurulumu, eski siteden yönlendirmeler, yayın sonrası destek." },
    ],
    deliverables: [
      "Onaylanmış site haritası ve sayfa içerik planı",
      "Masaüstü ve mobil tasarımlar",
      "Yönetim panelli, yayına hazır web sitesi",
      "Eski URL'ler için yönlendirme haritası (yenileme projelerinde)",
      "Panel kullanım rehberi",
    ],
    sectors: ["Sanayi ve üretim", "Mühendislik ve müşavirlik", "Sağlık ve klinikler", "Hukuk ve danışmanlık", "Eğitim kurumları", "Perakende ve hizmet işletmeleri"],
    process: [
      { title: "Keşif", text: "Görüşme, mevcut sitenin ve rakiplerin incelenmesi, hedeflerin yazılı hale getirilmesi." },
      { title: "Yapı", text: "Site haritası, sayfa kurguları ve içerik ihtiyaç listesi." },
      { title: "Tasarım", text: "Ana sayfa ve şablon sayfalar; onayınızla diğer sayfalara geçiş." },
      { title: "Geliştirme", text: "Yazılım, yönetim paneli, içerik girişi ve testler." },
      { title: "Yayın ve iyileştirme", text: "Yayına alma, Search Console kurulumu, ilk haftaların takibi." },
    ],
    faqs: [
      {
        q: "Kurumsal web sitesi fiyatını neler belirler?",
        a: "Sayfa sayısı, özel tasarım gerektiren bölümler, çok dilli yapı, entegrasyonlar (CRM, ödeme, ERP), içerik üretiminin kimde olduğu ve yönetim panelinden beklenen özellikler fiyatı belirleyen ana etkenlerdir. İhtiyacınızı teklif formunda anlatırsanız kapsamı netleştirip yazılı teklif hazırlarız.",
      },
      {
        q: "Web sitesi ne kadar sürede hazır olur?",
        a: "Süre; sayfa sayısına, içeriklerin hazır olup olmamasına ve onay döngülerinin hızına bağlıdır. En çok zaman kaybettiren konu genellikle içeriklerin gecikmesidir. Keşif görüşmesinden sonra aşamaları ve tarihleri içeren bir takvim paylaşıyoruz.",
      },
      {
        q: "Siteyi kendim güncelleyebilir miyim?",
        a: "Evet. Sayfa metinleri, hizmetler, projeler, blog yazıları, görseller ve SEO başlıkları yönetim panelinden düzenlenebilir. Teslimde panelin kullanımını gösteriyor ve yazılı bir rehber veriyoruz.",
      },
      {
        q: "Mevcut sitemizi yenilersek Google sıralamalarımız etkilenir mi?",
        a: "Yenileme dikkatli planlanmazsa etkilenebilir. Bunu önlemek için eski sitenin tüm adreslerini çıkarıyor, korunabilecek URL'leri aynen koruyor, değişenleri birebir 301 yönlendirmeyle yeni sayfalara bağlıyoruz. Yayından sonra Search Console'da tarama hatalarını takip ediyoruz.",
      },
      {
        q: "Alan adı ve hosting işlerini siz mi yapıyorsunuz?",
        a: "İsterseniz alan adı yönlendirmesi, sunucu kurulumu, SSL sertifikası ve yedekleme düzenini biz kuruyoruz. Alan adının ve sunucu hesaplarının firmanız adına kayıtlı olmasını öneriyoruz; erişim bilgileri teslimde size verilir.",
      },
    ],
    related: ["ankara-seo-hizmeti", "ankara-ozel-yazilim", "ankara-sosyal-medya-yonetimi"],
    quoteKey: "kurumsal-web",
    sortOrder: 1,
    seoTitle: "Web Tasarım ve Kurumsal Web Sitesi | Lagen Yazılım",
    seoDescription:
      "Hızlı, mobil uyumlu ve SEO altyapılı kurumsal web tasarım çözümleri. İşletmenize özel web sitesi projeniz için teklif alın.",
    updatedAt: "2026-11-04",
  },
  {
    slug: "ankara-seo-hizmeti",
    name: "SEO Hizmeti",
    shortName: "SEO",
    h1: "SEO Hizmeti: Teknik, İçerik ve Yerel SEO",
    summary: "Teknik altyapı, içerik ve yerel görünürlük üzerinden arama motorlarında kalıcı ve ölçülebilir büyüme.",
    heroText:
      "SEO bir eklenti ya da birkaç anahtar kelime ayarı değildir. Sitenizin taranabilir olması, doğru soruları cevaplayan içerikler ve güvenilir bir marka sinyali birlikte çalıştığında sonuç verir. Biz bu üç alanı aynı planla yönetiyoruz.",
    shortAnswer:
      "Lagen Yazılım'ın SEO hizmeti teknik SEO denetimi, anahtar kelime ve rakip analizi, içerik planı, sayfa içi optimizasyon, yerel SEO (Google Business Profile dahil) ve aylık raporlamayı kapsar. Çalışmalar Google Search Console ve analitik verileriyle ölçülür; sıralama garantisi verilmez, hangi işin neden yapıldığı her ay raporlanır.",
    icon: "search",
    problem:
      "Arama motorundan gelen ziyaretçi, bir ihtiyacı olduğu anda sizi arayan kişidir; bu yüzden en değerli trafik türlerinden biridir. Ancak birçok sitede teknik sorunlar sayfaların taranmasını engelliyor, içerikler gerçek soruları cevaplamıyor ve yerel aramalarda işletme hiç görünmüyor. Sonuçta reklam bütçesi artarken organik kanal boş kalıyor.",
    approach:
      "İşe tahmini değil, veriyle başlıyoruz: Search Console kayıtları, sitenin taranma durumu ve rakiplerin hangi sorgularda göründüğü. Önce teknik engelleri kaldırıyor, ardından ticari değeri yüksek sayfaları güçlendiriyor ve kullanıcıların gerçekten sorduğu sorulara cevap veren içerikler planlıyoruz. Yapay zekâ destekli arama sonuçlarında da anlaşılır olmak için içerikleri açık, doğrulanabilir ve iyi yapılandırılmış biçimde hazırlıyoruz.",
    scope: [
      { title: "Teknik SEO denetimi", text: "Tarama, indeksleme, hız, yönlendirme, canonical ve yapılandırılmış veri kontrolü." },
      { title: "Anahtar kelime ve rakip analizi", text: "Arama niyetine göre gruplanmış sorgular ve sayfa eşleştirmesi." },
      { title: "Sayfa içi optimizasyon", text: "Başlıklar, açıklamalar, başlık hiyerarşisi, iç bağlantılar ve görsel alt metinleri." },
      { title: "İçerik planı", text: "Hizmet sayfalarını destekleyen rehber ve blog içerikleri için takvim ve içerik özetleri." },
      { title: "Yerel SEO", text: "Google İşletme Profili, NAP tutarlılığı ve hizmet verdiğiniz şehirlere göre yerel sayfa stratejisi." },
      { title: "Raporlama", text: "Aylık rapor: yapılan işler, Search Console verileri ve bir sonraki adımlar." },
    ],
    deliverables: ["Teknik SEO denetim raporu", "Önceliklendirilmiş iş listesi", "Anahtar kelime ve sayfa eşleştirme tablosu", "İçerik takvimi", "Aylık performans raporu"],
    sectors: ["Hizmet işletmeleri", "Sanayi ve B2B firmalar", "Sağlık ve klinikler", "E-ticaret siteleri", "Eğitim kurumları"],
    process: [
      { title: "Denetim", text: "Teknik tarama, Search Console ve analitik verilerinin incelenmesi." },
      { title: "Strateji", text: "Hedef sorgular, sayfa eşleştirmesi ve öncelik sırası." },
      { title: "Uygulama", text: "Teknik düzeltmeler ve sayfa içi optimizasyon." },
      { title: "İçerik", text: "Plan doğrultusunda yeni içerikler ve mevcut sayfaların güncellenmesi." },
      { title: "Ölçüm", text: "Aylık rapor ve planın verilere göre güncellenmesi." },
    ],
    faqs: [
      {
        q: "SEO çalışmasının sonuçları ne zaman görülür?",
        a: "Teknik düzeltmelerin etkisi genellikle sayfalar yeniden tarandıktan sonra görülmeye başlar; rekabetçi sorgularda kalıcı ilerleme ise aylar sürebilir. Süre; sitenin geçmişine, rekabete ve içerik üretim hızına bağlıdır. Bu yüzden ilerlemeyi aylık raporlarla, Search Console verisi üzerinden birlikte takip ediyoruz.",
      },
      {
        q: "İlk sıraya çıkma garantisi veriyor musunuz?",
        a: "Hayır. Arama sonuçlarını hiçbir ajans kontrol edemez; sıralama garantisi veren bir teklif temkinle değerlendirilmelidir. Biz yapacağımız işleri, gerekçelerini ve ölçüm yöntemini baştan yazılı olarak paylaşıyoruz.",
      },
      {
        q: "Backlink nedir, satın almalı mıyım?",
        a: "Backlink, başka sitelerden sizin sitenize verilen bağlantıdır. Konuyla ilgili, güvenilir sitelerden gelen bağlantılar faydalıdır; satın alınan veya otomatik üretilen bağlantılar ise Google yönergelerine aykırıdır ve siteye zarar verebilir. Biz bağlantı kazanımını içerik, iş birlikleri ve gerçek tanıtım faaliyetleri üzerinden planlıyoruz.",
      },
      {
        q: "Yerel SEO ile genel SEO arasındaki fark nedir?",
        a: "Yerel SEO, \"Çankaya web tasarım\" gibi konum içeren veya haritada sonuç gösteren aramalara odaklanır. Google Business Profile, adres ve telefon tutarlılığı, yerel içerik ve müşteri değerlendirmeleri bu alanın temel unsurlarıdır. Genel SEO ise konumdan bağımsız sorguları kapsar.",
      },
      {
        q: "Ücretsiz SEO analizi neleri içeriyor?",
        a: "Sitenizi ve hedefinizi ilettiğinizde ekibimiz temel teknik kontrolleri (indekslenme, hız, başlıklar, mobil uyum) ve öncelikli fırsatları inceleyip size kısa bir değerlendirme gönderir. Otomatik bir puan değil, bir uzmanın baktığı bir ön inceleme alırsınız.",
      },
    ],
    related: ["ankara-web-tasarim", "ankara-sosyal-medya-yonetimi", "ankara-ozel-yazilim"],
    quoteKey: "seo",
    sortOrder: 2,
    seoTitle: "SEO Hizmeti ve Teknik SEO | Lagen Yazılım",
    seoDescription:
      "Teknik SEO, içerik planı ve yerel SEO hizmeti. Search Console verisiyle ölçülen, şeffaf raporlanan çalışma. Ücretsiz ön analiz isteyin.",
    updatedAt: "2026-11-04",
  },
  {
    slug: "ankara-sosyal-medya-yonetimi",
    name: "Sosyal Medya Yönetimi",
    shortName: "Sosyal Medya",
    h1: "Sosyal Medya Yönetimi ve İçerik Planı",
    summary: "Markanızın sesini tutarlı kılan içerik planı, tasarım ve topluluk yönetimi.",
    heroText:
      "Sosyal medyada düzenli paylaşım yapmak tek başına yeterli değil. Kime konuştuğunuzu bilen, markanızla tutarlı ve ölçülen bir içerik düzeni kuruyoruz.",
    shortAnswer:
      "Lagen Yazılım'ın sosyal medya yönetimi hizmeti hedef kitle ve rakip analizi, aylık içerik takvimi, gönderi ve hikâye tasarımları, metin yazımı, yayın planlaması, mesaj ve yorum yönetimi ile aylık raporlamayı kapsar. Hangi platformlarda yer alacağınız işinizin müşteri profiline göre birlikte belirlenir.",
    icon: "share",
    problem:
      "Çoğu işletme sosyal medyayı ya tamamen boş bırakıyor ya da birbirinden kopuk, plansız paylaşımlarla dolduruyor. Takipçi sayısı artsa bile bu ilgi siteye, mesaja ya da satışa dönüşmüyor; marka her paylaşımda farklı bir sesle konuşuyor.",
    approach:
      "Önce hangi platformun sizin için anlamlı olduğunu belirliyoruz; her işletmenin her platformda olması gerekmiyor. Ardından marka dilini, görsel şablonları ve içerik başlıklarını (ürün, süreç, ekip, bilgi, kampanya) tanımlıyor; bunları aylık takvime dönüştürüyoruz. Her ay hangi içeriğin işe yaradığını verilerle değerlendirip planı güncelliyoruz.",
    scope: [
      { title: "Strateji ve platform seçimi", text: "Hedef kitle, rakip hesaplar ve iş hedeflerine göre platform ve içerik yaklaşımı." },
      { title: "İçerik takvimi", text: "Aylık plan: konu, format, yayın günü ve hedef." },
      { title: "Tasarım ve metin", text: "Gönderi, karusel ve hikâye tasarımları; marka diline uygun metinler." },
      { title: "Yayın ve topluluk yönetimi", text: "Planlı yayın, yorum ve mesajların takibi." },
      { title: "Raporlama", text: "Erişim, etkileşim ve siteye yönlenen trafik üzerinden aylık değerlendirme." },
    ],
    deliverables: ["Sosyal medya stratejisi", "Görsel şablon seti", "Aylık içerik takvimi", "Aylık rapor"],
    sectors: ["Restoran ve kafeler", "Perakende", "Sağlık ve güzellik", "Eğitim", "B2B ve sanayi markaları"],
    process: [
      { title: "Analiz", text: "Mevcut hesaplar, rakipler ve hedef kitle." },
      { title: "Kimlik", text: "Marka dili, görsel şablonlar ve içerik başlıkları." },
      { title: "Takvim", text: "Aylık plan ve onay." },
      { title: "Yayın", text: "Üretim, yayın ve topluluk yönetimi." },
      { title: "Değerlendirme", text: "Aylık rapor ve planın güncellenmesi." },
    ],
    faqs: [
      {
        q: "Hangi platformlarda hizmet veriyorsunuz?",
        a: "Instagram, LinkedIn, Facebook ve YouTube başta olmak üzere işletmenizin müşterilerinin bulunduğu platformlarda çalışıyoruz. B2B bir firma için LinkedIn, perakende bir işletme için Instagram öncelikli olabilir; seçimi birlikte yapıyoruz.",
      },
      {
        q: "Reklam yönetimi de dahil mi?",
        a: "Ücretli reklam yönetimi ayrı planlanan bir çalışmadır. İhtiyacınız varsa teklif formunda belirtin; reklam bütçesi ve hedefler netleşince kapsamı ayrıca öneriyoruz.",
      },
      {
        q: "İçerikleri yayınlanmadan önce görebilir miyim?",
        a: "Evet. Aylık takvim ve tasarımlar yayın öncesinde onayınıza sunulur; onaylanmayan içerik yayınlanmaz.",
      },
      {
        q: "Paylaşımlar için görselleri kim hazırlıyor?",
        a: "Gönderi tasarımlarını biz hazırlıyoruz. Fotoğraf ve video çekimi yapmıyoruz; sizin sağladığınız ya da kullanım hakkına sahip olduğunuz görselleri tasarımlara yerleştiriyoruz.",
      },
    ],
    related: ["ankara-web-tasarim", "ankara-seo-hizmeti", "ankara-katalog-tasarimi"],
    quoteKey: "sosyal-medya",
    sortOrder: 3,
    seoTitle: "Sosyal Medya Yönetimi ve İçerik Planı | Lagen Yazılım",
    seoDescription:
      "Sosyal medya yönetimi: strateji, aylık içerik takvimi, tasarım, metin ve raporlama. Markanız için tutarlı bir sosyal medya düzeni kurun.",
    updatedAt: "2026-11-04",
  },
  {
    slug: "ankara-ozel-yazilim",
    name: "Özel Yazılım",
    shortName: "Özel Yazılım",
    h1: "İşinize Özel Yazılım Geliştirme",
    summary: "İş süreçlerinize göre tasarlanan web tabanlı yönetim panelleri, portallar ve entegrasyonlar.",
    heroText:
      "Excel tabloları, e-posta zincirleri ve birbirine bağlanmayan programlar büyüyen bir işletmeyi yavaşlatır. Süreçlerinizi tek bir web tabanlı sistemde toplayan, ihtiyacınız kadar büyüyen yazılımlar geliştiriyoruz.",
    shortAnswer:
      "Lagen Yazılım, işletmelerin kendi süreçlerine göre çalışan web tabanlı yazılımlar geliştirir: yönetim panelleri, müşteri ve bayi portalları, teklif ve sipariş takip sistemleri, raporlama ekranları ve mevcut yazılımlarla entegrasyonlar. Proje analizle başlar, kullanılabilir ilk sürüm erken teslim edilir ve geri bildirimle geliştirilir.",
    icon: "code",
    problem:
      "Hazır yazılımlar genel ihtiyaçlar için tasarlanır; işletmenizin kendine özgü iş akışına uymadığında ekip ya programa göre çalışmaya ya da işin bir kısmını tablo ve e-postayla yürütmeye başlar. Veri dağılır, hata riski artar ve kimin neyi ne zaman yaptığı izlenemez.",
    approach:
      "Önce mevcut süreci birlikte haritalıyoruz: hangi bilgi nereden geliyor, kim onaylıyor, nerede zaman kaybediliyor. Hazır bir yazılım ihtiyacınızı karşılıyorsa bunu açıkça söylüyoruz. Özel yazılım gerekiyorsa en kritik akışı içeren ilk sürümü öncelikli geliştiriyor, ekibiniz kullanmaya başladıktan sonra gelen geri bildirimlerle sistemi büyütüyoruz. Rol ve yetki yapısı, kayıt geçmişi ve yedekleme ilk günden tasarıma dahildir.",
    scope: [
      { title: "Süreç analizi", text: "Mevcut iş akışının, kullanıcı rollerinin ve veri ihtiyacının çıkarılması." },
      { title: "Yönetim panelleri", text: "Kayıt, onay, takip ve raporlama ekranları." },
      { title: "Müşteri ve bayi portalları", text: "Dış kullanıcıların güvenli girişle eriştiği sipariş, teklif veya belge alanları." },
      { title: "Entegrasyonlar", text: "Muhasebe, ERP, e-posta, SMS ve ödeme altyapılarıyla bağlantı." },
      { title: "Güvenlik ve yetkilendirme", text: "Rol tabanlı erişim, işlem kayıtları ve düzenli yedekleme." },
      { title: "Bakım ve geliştirme", text: "Yayın sonrası destek, güncellemeler ve yeni modüller." },
    ],
    deliverables: ["Süreç ve gereksinim dokümanı", "Ekran akışları ve prototip", "Çalışan ilk sürüm", "Kullanıcı ve yönetici rehberi", "Teknik dokümantasyon ve kaynak kod"],
    sectors: ["Üretim ve sanayi", "Bayi ağı olan firmalar", "Lojistik", "Hizmet ve saha ekipleri", "Eğitim kurumları"],
    process: [
      { title: "Analiz", text: "Süreç haritası, roller ve önceliklendirilmiş özellik listesi." },
      { title: "Prototip", text: "Ana ekranların tıklanabilir taslağı ve onay." },
      { title: "İlk sürüm", text: "En kritik akışın geliştirilmesi ve canlı kullanıma alınması." },
      { title: "Geliştirme döngüleri", text: "Geri bildirimle yeni modüller ve iyileştirmeler." },
      { title: "Destek", text: "Bakım, izleme ve yedekleme." },
    ],
    faqs: [
      {
        q: "Özel yazılım mı, hazır yazılım mı tercih etmeliyim?",
        a: "Süreciniz sektörde standartsa ve hazır bir ürün ihtiyacınızın büyük kısmını karşılıyorsa hazır yazılım daha hızlı ve ekonomik olabilir. Süreciniz rekabet avantajınızın bir parçasıysa, birden fazla sistemi birbirine bağlamanız gerekiyorsa veya kullanıcı sayısına göre lisans maliyeti hızla artıyorsa özel yazılım daha doğru olabilir. Analiz aşamasında bu kararı birlikte veriyoruz.",
      },
      {
        q: "Kaynak kod kime ait olur?",
        a: "Kaynak kodun mülkiyeti ve teslim koşulları proje sözleşmesinde açıkça yazılır. Kullanılan açık kaynak kütüphaneler kendi lisanslarına tabidir.",
      },
      {
        q: "Yazılım nerede çalışır?",
        a: "İhtiyaca göre kendi sunucunuzda veya sizin adınıza açılan bir bulut/VPS hesabında çalışır. Erişim bilgileri ve yedekleme düzeni teslimde size verilir.",
      },
      {
        q: "Mevcut programlarımızla entegre olabilir mi?",
        a: "Programınızın bir API'si veya veri aktarım yöntemi varsa genellikle evet. Analiz aşamasında entegrasyonun teknik olarak mümkün olup olmadığını ve kapsamını netleştiriyoruz.",
      },
    ],
    related: ["ankara-web-tasarim", "ankara-seo-hizmeti", "ankara-katalog-tasarimi"],
    quoteKey: "ozel-yazilim",
    sortOrder: 4,
    seoTitle: "Özel Yazılım Geliştirme | Lagen Yazılım",
    seoDescription:
      "Işletmenize özel web tabanlı yazılım: yönetim panelleri, portallar, teklif ve sipariş takip sistemleri, entegrasyonlar. Projenizi anlatın, teklif alın.",
    updatedAt: "2026-11-04",
  },
  {
    slug: "ankara-katalog-tasarimi",
    name: "Katalog Tasarımı",
    shortName: "Katalog",
    h1: "Katalog Tasarımı: Baskıya ve Dijitale Hazır",
    summary: "Ürünlerinizi satış ekibinizin ve bayilerinizin rahatça kullanacağı basılı ve dijital kataloglar.",
    heroText:
      "İyi bir katalog, ürünü hiç görmemiş birinin doğru seçimi yapmasını sağlar. Ürün bilgisini düzenleyen, markanızı taşıyan ve hem baskıda hem ekranda iyi çalışan kataloglar hazırlıyoruz.",
    shortAnswer:
      "Lagen Yazılım; ürün, firma ve hizmet katalogları için içerik kurgusu, sayfa tasarımı, ürün görsellerinin yerleşimi, baskıya hazır dosya ve dijital (PDF / web) katalog hazırlar. Özellikle teknik ürün bilgisi yoğun sanayi kataloglarında tablo ve ürün kodu düzenine öncelik verilir.",
    icon: "book",
    problem:
      "Kataloglar çoğu zaman son dakikada, eski dosyalar üzerine eklemeler yapılarak hazırlanıyor. Ürün kodları dağınık, fotoğraflar farklı ışıkta çekilmiş, teknik tablolar okunmuyor. Sonuç; satış ekibinin kullanmak istemediği, bayilerin her seferinde tekrar soru sorduğu bir doküman.",
    approach:
      "Tasarımdan önce ürün bilgisini düzenliyoruz: ürün grupları, kodlar, teknik değerler ve görseller tek bir listede toplanıyor. Ardından sayfa ızgarası ve tablo düzeni kuruluyor; böylece yeni ürün eklendiğinde katalog baştan tasarlanmadan güncellenebiliyor. Baskı dosyası ile dijital sürüm aynı kaynaktan üretiliyor.",
    scope: [
      { title: "İçerik kurgusu", text: "Ürün gruplama, sayfa sıralaması ve bilgi hiyerarşisi." },
      { title: "Sayfa ve tablo tasarımı", text: "Okunaklı teknik tablolar, ürün kartları ve kapak tasarımı." },
      { title: "Görsel yerleşimi", text: "Sağladığınız ürün görsellerinin tutarlı bir düzende sayfalara yerleştirilmesi." },
      { title: "Baskıya hazırlık", text: "Matbaa standartlarına uygun, kontrol edilmiş baskı dosyası." },
      { title: "Dijital katalog", text: "Bağlantılı PDF ve web sitesinde yayınlanabilir sürüm." },
    ],
    deliverables: ["Katalog içerik planı", "Kapak ve iç sayfa tasarımları", "Baskıya hazır dosya", "Dijital (PDF) sürüm", "Düzenlenebilir kaynak dosyalar"],
    sectors: ["Makine ve yedek parça", "Yapı malzemeleri", "Mobilya ve dekorasyon", "Kimya ve endüstriyel ürünler", "Tekstil ve iş elbiseleri"],
    process: [
      { title: "Bilgi toplama", text: "Ürün listesi, teknik veriler ve görsellerin derlenmesi." },
      { title: "Kurgu", text: "Bölümler, sayfa düzeni ve örnek sayfa onayı." },
      { title: "Tasarım", text: "Tüm sayfaların yerleşimi ve düzeltme turları." },
      { title: "Kontrol", text: "Ürün kodu, fiyat ve teknik değerlerin birlikte kontrolü." },
      { title: "Teslim", text: "Baskı dosyası, dijital sürüm ve kaynak dosyalar." },
    ],
    faqs: [
      {
        q: "Baskıyı da siz mi yaptırıyorsunuz?",
        a: "Baskıya hazır dosyayı teslim ediyoruz; isterseniz çalıştığınız matbaa ile koordinasyonu da yürütüyoruz. Kâğıt, cilt ve adet seçimleri baskı maliyetini doğrudan etkiler; bu konuda öneri sunuyoruz.",
      },
      {
        q: "Ürün fotoğraflarımız yok, ne yapmalıyız?",
        a: "Fotoğraf çekimi yapmıyoruz. Katalog için ürünlerin aynı ışık ve arka plan düzeninde çekilmesi önemlidir; bu çekimi bir fotoğrafçıyla yaptırmanızı öneriyor, görsellerin hangi ölçü ve düzende gerektiğini önceden yazılı olarak paylaşıyoruz.",
      },
      {
        q: "Katalog sonradan güncellenebilir mi?",
        a: "Evet. Sayfa düzeni şablon mantığıyla kurulduğu için yeni ürünler ve fiyat değişiklikleri kataloğu baştan tasarlamadan eklenebilir. Kaynak dosyalar size teslim edilir.",
      },
    ],
    related: ["ankara-web-tasarim", "ankara-ozel-yazilim", "ankara-sosyal-medya-yonetimi"],
    quoteKey: "katalog",
    sortOrder: 5,
    seoTitle: "Katalog Tasarımı: Ürün Kataloğu | Lagen Yazılım",
    seoDescription:
      "Basılı ve dijital katalog tasarımı. Ürün bilgisini düzenleyen, okunaklı teknik tablolar ve baskıya hazır dosyalar. Kataloğunuz için teklif alın.",
    updatedAt: "2026-11-04",
  },
];
