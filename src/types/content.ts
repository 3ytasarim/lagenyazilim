export type FaqItem = { q: string; a: string };
export type TitledText = { title: string; text: string };

export type SeoFields = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalOverride?: string | null;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  /** Odak + ikincil anahtar kelimeler (admin › SEO paneli) */
  keywords?: string[];
};

export type ServiceIcon = "layout" | "search" | "share" | "code" | "book" | "camera" | "cart" | "sparkles";

export type Service = SeoFields & {
  slug: string;
  name: string;
  shortName: string;
  h1: string;
  /** Kart ve dizin açıklaması (1–2 cümle). */
  summary: string;
  heroText: string;
  /** Sayfa başındaki doğrudan cevap paragrafı (GEO: "bu hizmet nedir, kime uygun"). */
  shortAnswer: string;
  icon: ServiceIcon;
  problem: string;
  approach: string;
  scope: TitledText[];
  deliverables: string[];
  sectors: string[];
  process: TitledText[];
  faqs: FaqItem[];
  related: string[];
  /** Teklif sihirbazında ön seçilecek hizmet anahtarı. */
  quoteKey: string;
  sortOrder: number;
  /** Panelden eklenen serbest içerik (temizlenmiş HTML). */
  bodyHtml?: string;
  updatedAt: string;
};

export type Region = {
  slug: string;
  name: string;
  kind: "city" | "district" | "neighborhood" | "zone";
  priority: number;
  /** Yayında bir bölge sayfası var mı — yoksa dizinde bağlantı verilmez. */
  hasPage: boolean;
};

export type PostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  category: { slug: string; name: string } | null;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  cover: { src: string; alt: string; width: number; height: number } | null;
};

export type ProjectSummary = {
  slug: string;
  title: string;
  clientName: string;
  sector: string;
  services: string[];
  summary: string;
  cover: { src: string; alt: string; width: number; height: number } | null;
};
