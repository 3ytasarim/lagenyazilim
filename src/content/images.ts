/**
 * Site genelinde kullanılan stok fotoğraflar.
 * Kaynak ve lisans bilgisi: docs/image-credits.md — yeni görsel eklerken orayı da güncelleyin.
 * Dosyalar public/images/ altında (WebP, en fazla 2400 px genişlik).
 */
export type SiteImage = { src: string; alt: string; width: number; height: number };

export type ImageKey =
  | "web-design"
  | "seo"
  | "social-media"
  | "software"
  | "catalog"
  | "team-meeting"
  | "ankara"
  | "industry"
  | "office-services"
  | "logistics"
  | "startup"
  | "process";

export const IMAGES: Partial<Record<ImageKey, SiteImage>> = {
  "web-design": { src: "/images/web-design.webp", alt: "Kâğıt üzerinde suluboya ile çizilmiş web sitesi taslakları", width: 1600, height: 1067 },
  seo: { src: "/images/seo.webp", alt: "Dizüstü bilgisayar ekranında site performansı ve ziyaretçi grafikleri", width: 1600, height: 1067 },
  "social-media": { src: "/images/social-media.webp", alt: "Akıllı telefonla yatay video çekimi yapan el", width: 1600, height: 1065 },
  software: { src: "/images/software.webp", alt: "Ekranda renklendirilmiş yazılım kodu yakın çekimi", width: 1600, height: 1067 },
  catalog: { src: "/images/catalog.webp", alt: "Ahşap masa üzerinde açık duran basılı katalog sayfaları", width: 1600, height: 1200 },
  "team-meeting": { src: "/images/team-meeting.webp", alt: "Aydınlık bir ofiste proje toplantısı yapan küçük ekip", width: 1600, height: 1067 },
  ankara: { src: "/images/ankara.webp", alt: "Sisli bir günde Atakule ve Ankara şehir silüeti", width: 1600, height: 1054 },
  industry: { src: "/images/industry.webp", alt: "Üretim hattında çalışan mavi endüstriyel robot kol", width: 1600, height: 1003 },
  "office-services": { src: "/images/office-services.webp", alt: "Aydınlık ve düzenli bir muayenehane bekleme salonu", width: 1600, height: 1038 },
  logistics: { src: "/images/logistics.webp", alt: "Yüksek metal raflarla dolu geniş depo içi", width: 1600, height: 557 },
  startup: { src: "/images/startup.webp", alt: "Fırınında taze ekmek hazırlayan küçük işletme sahibi", width: 1600, height: 1067 },
  process: { src: "/images/process.webp", alt: "Masa üzerinde yapışkan notlarla müşteri yolculuğu haritası hazırlayan ekip", width: 1600, height: 1067 },
};

export function img(key: ImageKey): SiteImage | undefined {
  return IMAGES[key];
}

/** Hizmet slug'ı → görsel anahtarı */
export const SERVICE_IMAGE: Record<string, ImageKey> = {
  "ankara-web-tasarim": "web-design",
  "ankara-seo-hizmeti": "seo",
  "ankara-sosyal-medya-yonetimi": "social-media",
  "ankara-ozel-yazilim": "software",
  "ankara-katalog-tasarimi": "catalog",
};

export function serviceImage(slug: string): SiteImage | undefined {
  const key = SERVICE_IMAGE[slug];
  return key ? IMAGES[key] : undefined;
}
