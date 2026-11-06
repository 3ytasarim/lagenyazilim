/**
 * Yasal metin TASLAKLARI — hukuki onaydan geçmeden yayına esas alınmamalıdır.
 * Köşeli parantezli [ ... ] alanlar firma bilgisiyle tamamlanacaktır.
 * Sprint 2'de `pages` tablosuna (requires_legal_review = true) taşınır.
 */
export type LegalSection = { h: string; p?: string[]; list?: string[] };
export type LegalDoc = { slug: string; title: string; description: string; version: string; sections: LegalSection[] };

const CONTROLLER = "[Şirket unvanı] (\"Lagen Yazılım\")";
const ADDRESS = "Harbiye Mahallesi, Bayram Çıtak Sokak [bina no], Çankaya / Ankara";

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    description: "Lagen Yazılım web sitesi formları aracılığıyla işlenen kişisel veriler hakkında 6698 sayılı Kanun kapsamında aydınlatma metni.",
    version: "taslak-2026-11",
    sections: [
      {
        h: "1. Veri sorumlusu",
        p: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla ${CONTROLLER} tarafından aşağıda açıklanan kapsamda işlenmektedir. Adres: ${ADDRESS}. E-posta: info@lagenyazilim.com.tr.`,
        ],
      },
      {
        h: "2. İşlenen kişisel veriler",
        list: [
          "Kimlik ve iletişim: ad soyad, e-posta adresi, telefon numarası, firma adı, şehir / ilçe",
          "Talep bilgileri: hizmet tercihleri, proje açıklaması, bütçe ve takvim tercihleri, web sitesi adresi, yüklediğiniz dosyalar",
          "İşlem güvenliği: talebin gönderildiği tarih ve saat, IP adresinin geri döndürülemez özeti, tarayıcı bilgisi",
        ],
      },
      {
        h: "3. İşleme amaçları",
        list: [
          "Teklif, iletişim ve ücretsiz SEO analizi taleplerinizin alınması, değerlendirilmesi ve yanıtlanması",
          "Talebinize ilişkin sizinle iletişime geçilmesi ve teklif hazırlanması",
          "Kötüye kullanımın (spam, otomatik gönderim) önlenmesi ve bilgi güvenliğinin sağlanması",
          "Hukuki yükümlülüklerin yerine getirilmesi",
        ],
      },
      {
        h: "4. Hukuki sebepler",
        p: [
          "Kişisel verileriniz KVKK m.5/2-c (bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması), m.5/2-ç (hukuki yükümlülük) ve m.5/2-f (veri sorumlusunun meşru menfaati) hukuki sebeplerine dayanılarak işlenmektedir. Açık rızanızın gerektiği hâllerde (ör. [yurt dışı aktarım gerekiyorsa]) ayrıca açık rızanız alınır.",
        ],
      },
      {
        h: "5. Aktarım",
        p: [
          "Kişisel verileriniz; yukarıdaki amaçlarla sınırlı olarak, hizmet aldığımız barındırma (sunucu) ve e-posta hizmet sağlayıcılarına ve talep hâlinde yetkili kamu kurum ve kuruluşlarına aktarılabilir. [Barındırma ve e-posta sağlayıcılarının yurt içi / yurt dışı konumu hukuki inceleme sonrası belirtilecektir.]",
        ],
      },
      {
        h: "6. Toplama yöntemi",
        p: ["Kişisel verileriniz, web sitemizdeki formları doldurmanız yoluyla elektronik ortamda, otomatik olmayan yollarla toplanmaktadır."],
      },
      {
        h: "7. Saklama süresi",
        p: ["Talepleriniz, ilgili mevzuatta öngörülen veya işleme amacının gerektirdiği süre boyunca saklanır; süre sonunda silinir, yok edilir veya anonim hâle getirilir. [Somut süreler hukuki inceleme sonrası belirtilecektir.]"],
      },
      {
        h: "8. Haklarınız",
        p: ["KVKK m.11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, KVKK m.7 çerçevesinde silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, otomatik sistemlerle analiz sonucu aleyhinize bir sonuç çıkmasına itiraz etme ve kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz."],
      },
      {
        h: "9. Başvuru",
        p: ["Taleplerinizi info@lagenyazilim.com.tr adresine veya yukarıdaki posta adresine yazılı olarak iletebilirsiniz. Başvurular en geç otuz gün içinde ücretsiz olarak sonuçlandırılır."],
      },
    ],
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    description: "Lagen Yazılım web sitesinin ziyaretçi verilerini nasıl topladığı, kullandığı ve koruduğu hakkında bilgi.",
    version: "taslak-2026-11",
    sections: [
      { h: "Kapsam", p: ["Bu politika lagenyazilim.com.tr alan adı altındaki web sitesinin kullanımı sırasında toplanan bilgileri kapsar. Form aracılığıyla iletilen kişisel verilere ilişkin ayrıntılar KVKK Aydınlatma Metni'nde yer alır."] },
      {
        h: "Topladığımız bilgiler",
        list: [
          "Formlarda kendi isteğinizle paylaştığınız bilgiler",
          "Sunucu kayıtları: istek zamanı, istenen sayfa, tarayıcı türü ve IP adresinin geri döndürülemez özeti",
          "Çerez onayı vermeniz hâlinde analitik çerezlerle toplanan anonim kullanım verileri",
        ],
      },
      { h: "Güvenlik", p: ["Site yalnızca şifreli bağlantı (HTTPS) üzerinden sunulur. Form verileri ve yüklenen dosyalar herkese açık olmayan alanlarda saklanır; yalnızca yetkili personel erişebilir."] },
      { h: "Üçüncü taraf bağlantılar", p: ["Sitemiz başka sitelere bağlantı verebilir. Bu sitelerin gizlilik uygulamalarından sorumlu değiliz."] },
      { h: "Değişiklikler", p: ["Bu politika güncellendiğinde sayfadaki sürüm bilgisi değiştirilir."] },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    description: "Lagen Yazılım web sitesinde kullanılan çerezler ve çerez tercihlerinizi nasıl yönetebileceğiniz.",
    version: "taslak-2026-11",
    sections: [
      { h: "Çerez nedir?", p: ["Çerezler, ziyaret ettiğiniz siteler tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır."] },
      {
        h: "Kullandığımız çerezler",
        list: [
          "Zorunlu: sitenin güvenli çalışması için gereken çerezler (ör. çerez tercihinizin saklanması). Onay gerektirmez.",
          "Tercih: tema (açık/koyu) seçiminiz tarayıcınızın yerel deposunda saklanır.",
          "Analitik (onaya bağlı): ziyaret istatistikleri için [Google Analytics 4 / Umami] çerezleri. Onay vermediğiniz sürece yüklenmez.",
        ],
      },
      { h: "Tercihlerinizi yönetme", p: ["Sayfanın altındaki çerez tercihleri bağlantısından onayınızı dilediğiniz zaman değiştirebilir veya geri alabilirsiniz. Tarayıcı ayarlarınızdan da çerezleri silebilirsiniz."] },
    ],
  },
  {
    slug: "acik-riza-metni",
    title: "Açık Rıza Metni",
    description: "Lagen Yazılım formları aracılığıyla verilen isteğe bağlı açık rıza beyanı.",
    version: "taslak-2026-11",
    sections: [
      {
        h: "Beyan",
        p: [
          `KVKK Aydınlatma Metni'ni okudum. [Açık rızaya dayanan işleme faaliyeti hukuki inceleme sonrası burada açıkça tanımlanacaktır — ör. kişisel verilerimin yurt dışında bulunan e-posta hizmet sağlayıcısına aktarılması.] Bu kapsamda kişisel verilerimin ${CONTROLLER} tarafından işlenmesine açık rıza veriyorum.`,
          "Açık rıza vermek isteğe bağlıdır; vermemeniz talebinizin değerlendirilmesini engellemez. Rızanızı dilediğiniz zaman info@lagenyazilim.com.tr adresine yazarak geri alabilirsiniz.",
        ],
      },
    ],
  },
];
