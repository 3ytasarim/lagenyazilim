import type { TitledText } from "@/types/content";

export const HOME_HERO = {
  eyebrow: "Türkiye geneli · Web, yazılım ve dijital pazarlama",
  title: "İşinizi büyüten web tasarım, yazılım ve dijital çözümler",
  /** Başlığın vurgulanan bölümü (title içinde birebir geçmeli). */
  titleAccent: "web tasarım, yazılım ve dijital çözümler",
  chips: [
    { label: "Web tasarım", href: "/ankara-web-tasarim/" },
    { label: "SEO", href: "/ankara-seo-hizmeti/" },
    { label: "Özel yazılım", href: "/ankara-ozel-yazilim/" },
    { label: "Sosyal medya", href: "/ankara-sosyal-medya-yonetimi/" },
    { label: "Katalog", href: "/ankara-katalog-tasarimi/" },
  ],
  lead: "Lagen Yazılım olarak Türkiye'nin her yerindeki markalar için hızlı, kullanıcı odaklı ve büyüme hedeflerine uygun web siteleri, özel yazılımlar ve dijital pazarlama çözümleri geliştiriyoruz. Ofisimiz Ankara'da.",
  primary: { label: "Projeniz için teklif alın", href: "/proje-teklifi/" },
  secondary: { label: "Hizmetlerimizi inceleyin", href: "/hizmetlerimiz/" },
};

/** "Neden Lagen" — kurumsal taahhüt değil, çalışma biçiminin anlatımı. */
export const WHY_LAGEN: TitledText[] = [
  {
    title: "Önce ihtiyaç, sonra ekran",
    text: "Her proje bir keşif görüşmesiyle başlar. Hedef kitlenizi, rakiplerinizi ve sitenin ya da yazılımın ölçülecek hedefini yazılı hale getirmeden tasarıma geçmeyiz.",
  },
  {
    title: "Tasarım, yazılım ve SEO aynı masada",
    text: "Görsel tasarım, kod ve arama motoru altyapısı farklı ekiplerin sırayla eklediği katmanlar değildir. Aynı plan üzerinden birlikte kurulur; sonradan yamanmaz.",
  },
  {
    title: "Yönetebileceğiniz sistemler",
    text: "Teslim ettiğimiz sitelerde içerikleri, görselleri ve SEO ayarlarını panelden kendiniz güncelleyebilirsiniz. Sizi her küçük değişiklik için bize bağımlı bırakmayız.",
  },
  {
    title: "Yayından sonra da yanınızda",
    text: "Yayın günü işin bitişi değildir. Search Console kayıtlarını, form taleplerini ve hız ölçümlerini izler, gereken iyileştirmeleri planlarız.",
  },
];

export const PROCESS: TitledText[] = [
  { title: "Keşif", text: "Görüşme, mevcut durum ve rakip incelemesi, hedeflerin netleşmesi." },
  { title: "Strateji", text: "Kapsam, site haritası veya yazılım akışı, takvim ve yazılı teklif." },
  { title: "Tasarım", text: "Markanıza özgü arayüz; önce ana şablonlar, onayla diğer ekranlar." },
  { title: "Geliştirme", text: "Yazılım, yönetim paneli, içerik girişi, hız ve erişilebilirlik testleri." },
  { title: "Yayın ve iyileştirme", text: "Yayına alma, ölçüm kurulumu ve verilere dayalı iyileştirmeler." },
];

export const PROJECT_CTA = {
  title: "Projenizi birlikte planlayalım",
  text: "İhtiyacınızı birkaç adımda anlatın; kapsamı değerlendirip size yazılı bir yol haritası ve teklif ile dönelim.",
};
