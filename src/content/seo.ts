/**
 * Statik sayfaların meta başlık, açıklama ve anahtar kelimeleri.
 * Konumlandırma: Türkiye geneli hizmet, ofis Ankara (2026-11). Kaynak: docs/keyword-research.md; her birincil terimin tek sahibi var.
 * Başlıklar marka ekini içerir (≤60 karakter); açıklamalar 140–160 karakter, rakam/garanti iddiası yok.
 */
type PageSeo = { title: string; description: string; keywords: string[]; absoluteTitle: true };

const seo = (title: string, description: string, keywords: string[]): PageSeo => ({ title, description, keywords, absoluteTitle: true });

export const PAGE_SEO = {
  home: seo(
    "Web Tasarım ve Yazılım Ajansı – Türkiye | Lagen Yazılım",
    "Türkiye genelinde işletmelere kurumsal web tasarım, SEO, özel yazılım ve sosyal medya hizmetleri. Ankara ofisimizden uzaktan çalışıyoruz; teklif alın.",
    ["web tasarım ajansı","web tasarım ve yazılım firması","dijital ajans","kurumsal web sitesi","türkiye web tasarım","ankara web tasarım ajansı","lagen yazılım"],
  ),
  services: seo(
    "Hizmetlerimiz: Web, SEO, Yazılım, Tasarım | Lagen Yazılım",
    "Web tasarım, SEO, sosyal medya, özel yazılım ve katalog tasarımı hizmetlerimizi inceleyin; Türkiye genelinde işletmenize uygun olanı seçip teklif isteyin.",
    ["dijital ajans hizmetleri","web tasarım seo ve yazılım hizmetleri","kurumsal web sitesi","seo hizmeti","özel yazılım geliştirme","katalog tasarımı"],
  ),
  about: seo(
    "Hakkımızda – Ankara Merkezli Dijital Ajans | Lagen Yazılım",
    "Lagen Yazılım'ı tanıyın: Ankara Çankaya'daki ekibimiz, Türkiye genelindeki işletmelerle çalışma yaklaşımımız ve proje sürecimiz. Tanışmak için bize yazın.",
    ["lagen yazılım","lagen yazılım kimdir","ankara merkezli dijital ajans","türkiye geneli web ajansı"],
  ),
  solutions: seo(
    "Sektörel Dijital Çözümler – Sanayi, Bayi | Lagen Yazılım",
    "Sanayi ve üretim, hizmet işletmeleri, bayi/dağıtım ağları ve yeni markalar için web, yazılım ve SEO çözümleri. Türkiye genelinde sektörünüze uygun yol haritası.",
    ["sektöre özel dijital çözümler","sanayi firmaları için web sitesi","üretim firması kurumsal web sitesi","bayi sipariş yazılımı","hizmet işletmeleri için web sitesi","yeni marka web sitesi"],
  ),
  regions: seo(
    "Hizmet Bölgeleri – Türkiye Geneli | Lagen Yazılım",
    "Türkiye'nin her ilindeki işletmelerle uzaktan, Ankara'da yüz yüze çalışıyoruz. Büyükşehirler ve Ankara ilçeleri için bölgeye özel sayfalarımızı inceleyin.",
    ["türkiye geneli web tasarım","uzaktan web tasarım hizmeti","istanbul web tasarım","izmir web tasarım","ankara web tasarım","il il web tasarım"],
  ),
  ankara: seo(
    "Ankara Web Tasarım – 25 İlçe Hizmet Bölgesi | Lagen Yazılım",
    "Ofisimizin bulunduğu Ankara'nın 25 ilçesinde web tasarım, SEO ve yazılım. İlçenizi seçin; bölgenizin iş yapısına uygun yaklaşımı ve görüşme seçeneklerini görün.",
    ["ankara web tasarım","ankara ilçelerinde web tasarım ve seo","ankara web sitesi yaptırma","ankara yüz yüze görüşme web ajansı","ostim ivedik web sitesi"],
  ),
  blog: seo(
    "Blog: Web Tasarım, SEO ve Yazılım Rehberleri | Lagen Yazılım",
    "Web sitesi yaptırma, SEO, sosyal medya ve özel yazılım kararları için işletmelere yönelik sade, uygulanabilir rehberler ve kontrol listeleri.",
    ["web tasarım rehberi","seo rehberi","web sitesi yaptırma rehberi","özel yazılım rehberi","teknik seo kontrol listesi","geo yapay zeka aramaları"],
  ),
  quote: seo(
    "Proje Teklifi Alın – Web ve Yazılım | Lagen Yazılım",
    "Projenizi birkaç adımda anlatın; kapsam, süre ve bütçe seçeneklerini içeren teklifimizi size iletelim. Türkiye genelinde web, SEO ve yazılım projeleri için.",
    ["web sitesi teklif al","web sitesi yaptırmak istiyorum","web tasarım fiyat teklifi","yazılım projesi teklif formu"],
  ),
  seoAudit: seo(
    "Ücretsiz SEO Analizi – Sitenizi İnceleyelim | Lagen Yazılım",
    "Web sitenizin teknik SEO, hız, içerik ve yerel görünürlük durumunu inceleyip öncelikli iyileştirmeleri raporlayalım. Formu doldurun, ücretsiz analiz alın.",
    ["ücretsiz seo analizi","web sitesi seo analizi","sitem neden google'da çıkmıyor","seo kontrol listesi"],
  ),
  contact: seo(
    "İletişim – Ankara Ofis, Türkiye Geneli | Lagen Yazılım",
    "Lagen Yazılım'a telefon, WhatsApp, e-posta veya formla ulaşın. Türkiye'nin her yerinden çevrim içi görüşelim ya da Ankara Çankaya'daki ofisimize gelin.",
    ["lagen yazılım iletişim","lagen yazılım adres","lagen yazılım telefon","web ajansı iletişim"],
  ),
  projects: seo(
    "Projelerimiz ve Vaka Analizleri | Lagen Yazılım",
    "Lagen Yazılım'ın müşteri izniyle yayımlanan web tasarım, yazılım, SEO ve katalog projeleri; ihtiyaç, çözüm ve süreç anlatımlarıyla.",
    ["lagen yazılım projeleri", "web tasarım referansları ankara", "kurumsal web sitesi örnekleri"],
  ),
} as const;

/**
 * Hizmet sayfaları: odak ve ikincil anahtar kelimeler + meta başlık/açıklama
 * (veritabanına scripts/apply-seo-keywords.ts ile yazılır; sonrası admin › SEO panelinden yönetilir).
 */
export const SERVICE_SEO: Record<string, { seoTitle: string; seoDescription: string; focusKeyword: string; secondaryKeywords: string[] }> = {
  "ankara-web-tasarim": {
    "seoTitle": "Kurumsal Web Tasarım Hizmeti – Türkiye | Lagen Yazılım",
    "seoDescription": "Türkiye genelinde hızlı, mobil uyumlu, SEO altyapısı hazır kurumsal web siteleri. Kapsamı, süreci ve maliyet etkenlerini birlikte netleştirelim; teklif isteyin.",
    "focusKeyword": "kurumsal web tasarım",
    "secondaryKeywords": [
      "web tasarım",
      "web sitesi yaptırma",
      "kurumsal web sitesi",
      "web tasarım fiyatları",
      "mobil uyumlu web sitesi",
      "ankara web tasarım"
    ]
  },
  "ankara-seo-hizmeti": {
    "seoTitle": "SEO Hizmeti ve Danışmanlığı – Türkiye | Lagen Yazılım",
    "seoDescription": "Teknik SEO, içerik planı ve yerel SEO ile Google'da ve yapay zekâ aramalarında görünürlüğünüzü artırmaya odaklanan SEO hizmeti. Ücretsiz analiz isteyin.",
    "focusKeyword": "seo hizmeti",
    "secondaryKeywords": [
      "seo ajansı",
      "seo danışmanlığı",
      "teknik seo",
      "yerel seo",
      "geo yapay zeka seo",
      "ankara seo"
    ]
  },
  "ankara-sosyal-medya-yonetimi": {
    "seoTitle": "Sosyal Medya Yönetimi ve Ajansı | Lagen Yazılım",
    "seoDescription": "İşletmeler için içerik planı, gönderi tasarımı ve paylaşım takvimiyle düzenli sosyal medya yönetimi. Türkiye genelinde çalışıyoruz; kapsamı konuşalım.",
    "focusKeyword": "sosyal medya yönetimi",
    "secondaryKeywords": [
      "sosyal medya ajansı",
      "sosyal medya danışmanlığı",
      "instagram yönetimi",
      "linkedin yönetimi b2b",
      "sosyal medya içerik planı",
      "ankara sosyal medya ajansı"
    ]
  },
  "ankara-ozel-yazilim": {
    "seoTitle": "Özel Yazılım Geliştirme Firması | Lagen Yazılım",
    "seoDescription": "İş süreçlerinize göre web tabanlı panel, teklif/CRM ve entegrasyon yazılımları geliştiriyoruz. İhtiyacınızı analiz edelim, yol haritasını birlikte çıkaralım.",
    "focusKeyword": "özel yazılım geliştirme",
    "secondaryKeywords": [
      "yazılım firması",
      "firmaya özel yazılım",
      "web tabanlı yazılım",
      "yönetim paneli yazılımı",
      "teklif ve crm yazılımı",
      "ankara yazılım firması"
    ]
  },
  "ankara-katalog-tasarimi": {
    "seoTitle": "Katalog Tasarımı – Ürün ve Kurumsal | Lagen Yazılım",
    "seoDescription": "Ürün ve kurumsal kataloglarınızı baskıya ve dijital kullanıma hazır tasarlıyoruz. Sayfa sayısı ve içeriğinize göre kapsamı belirleyelim; teklif isteyin.",
    "focusKeyword": "katalog tasarımı",
    "secondaryKeywords": [
      "ürün kataloğu tasarımı",
      "kurumsal katalog tasarımı",
      "dijital pdf katalog",
      "katalog tasarımı fiyatları",
      "ankara katalog tasarımı"
    ]
  }
};

/** İlçe sayfaları için anahtar kelime kalıbı (ilçe sayfası "ankara web tasarım" terimini hedeflemez — §3). */
const SERVICE_TERMS: Record<string, (d: string) => string[]> = {
  "ankara-web-tasarim": (d) => [`${d} web tasarım`, `${d} web sitesi yaptırma`, `${d} kurumsal web sitesi`],
  "ankara-seo-hizmeti": (d) => [`${d} seo`, `${d} yerel seo`],
  "ankara-sosyal-medya-yonetimi": (d) => [`${d} sosyal medya yönetimi`],
  "ankara-ozel-yazilim": (d) => [`${d} yazılım firması`, `${d} özel yazılım`],
  "ankara-katalog-tasarimi": (d) => [`${d} katalog tasarımı`],
};

export function districtKeywords(district: string, relatedServiceSlugs: string[]) {
  const d = district.toLocaleLowerCase("tr-TR");
  const focus = `${d} web tasarım`;
  const rest = [`${d} web sitesi yaptırma`, ...relatedServiceSlugs.flatMap((s) => SERVICE_TERMS[s]?.(d) ?? []), `${d} dijital pazarlama`];
  return { focusKeyword: focus, secondaryKeywords: [...new Set(rest)].filter((k) => k !== focus).slice(0, 8) };
}
