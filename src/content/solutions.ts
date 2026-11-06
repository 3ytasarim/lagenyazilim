/** Sektöre göre çözüm paketleri — hizmetlerin hangi ihtiyaç için nasıl birleştiğini anlatır. */
export type Solution = {
  id: string;
  title: string;
  who: string;
  needs: string[];
  services: string[];
};

export const SOLUTIONS: Solution[] = [
  {
    id: "sanayi",
    title: "Sanayi ve üretim firmaları",
    who: "Ostim, İvedik ve diğer sanayi bölgelerindeki üreticiler, makine ve yedek parça firmaları, B2B tedarikçiler.",
    needs: [
      "Teknik ürün bilgisinin sitede ve katalogda düzenli sunulması",
      "Yurt içi ve yurt dışı alıcıların ürün aramasıyla siteye ulaşması",
      "Tesis ve üretim kapasitesini gösteren gerçek görseller",
      "Teklif taleplerinin tek bir yerde toplanması",
    ],
    services: ["ankara-web-tasarim", "ankara-katalog-tasarimi", "ankara-ozel-yazilim", "ankara-seo-hizmeti"],
  },
  {
    id: "hizmet",
    title: "Hizmet işletmeleri ve klinikler",
    who: "Danışmanlık, hukuk, sağlık, eğitim ve yerel hizmet veren işletmeler.",
    needs: [
      "Bulunduğu şehir ve ilçede yapılan aramalarda görünmek",
      "Randevu veya ön görüşme talebini kolaylaştırmak",
      "Uzmanlığı ve güveni anlatan, düzenli güncellenen içerik",
      "Google Business Profile ve sosyal medyanın siteyle tutarlı olması",
    ],
    services: ["ankara-web-tasarim", "ankara-seo-hizmeti", "ankara-sosyal-medya-yonetimi"],
  },
  {
    id: "bayi",
    title: "Bayi ağı ve saha ekibi olan firmalar",
    who: "Dağıtım, bayi ve servis ağıyla çalışan; sipariş, teklif ve belge akışı yoğun firmalar.",
    needs: [
      "Bayilerin sipariş ve belgeye güvenli girişle ulaşması",
      "Teklif ve sipariş süreçlerinin tablolardan çıkarılması",
      "Muhasebe veya ERP ile veri aktarımı",
      "Yöneticiler için anlık raporlama",
    ],
    services: ["ankara-ozel-yazilim", "ankara-web-tasarim", "ankara-katalog-tasarimi"],
  },
  {
    id: "yeni-marka",
    title: "Yeni kurulan markalar",
    who: "Pazara yeni giren, dijital varlığını sıfırdan kuran işletmeler.",
    needs: [
      "Markanın ilk günden tutarlı bir görünüme kavuşması",
      "Bütçeyi doğru önceliklendiren, büyüdükçe genişleyen bir site",
      "Sosyal medya için sürdürülebilir bir içerik düzeni",
      "Arama motorlarında temelden doğru kurulmuş altyapı",
    ],
    services: ["ankara-web-tasarim", "ankara-sosyal-medya-yonetimi", "ankara-katalog-tasarimi", "ankara-seo-hizmeti"],
  },
];
