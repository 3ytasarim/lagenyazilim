/** Mutlak site kökü — canonical, sitemap ve JSON-LD buradan üretilir. Sonda "/" yok. */
function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lagenyazilim.com.tr").replace(/\/+$/, "");
  if (!raw.startsWith("https://") && process.env.SITE_URL_ALLOW_INSECURE !== "1") {
    throw new Error("NEXT_PUBLIC_SITE_URL https ile başlamalı (yerelde SITE_URL_ALLOW_INSECURE=1).");
  }
  return raw;
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Lagen Yazılım";
export const SITE_LOCALE = "tr_TR";

/** "/ankara-web-tasarim/" → "https://www.../ankara-web-tasarim/" */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export type BusinessInfo = {
  name: string;
  legalName: string | null;
  slogan: string;
  phone: string;
  phoneE164: string;
  whatsappE164: string;
  email: string;
  address: {
    street: string;
    neighborhood: string;
    district: string;
    city: string;
    postalCode: string | null;
  };
  /** Doğrulanmamış alanlar null bırakılır; arayüz ve şema null alanı göstermez. */
  openingHours: string | null;
  mapsUrl: string | null;
  social: { label: string; href: string }[];
};

/** Mevcut siteden doğrulanan NAP bilgileri (2026-11-04). Sprint 2'de site_settings'e taşınır. */
export const DEFAULT_BUSINESS: BusinessInfo = {
  name: "Lagen Yazılım",
  legalName: null,
  slogan: "Her Zaman Zirveye Oyna",
  phone: "0533 285 70 90",
  phoneE164: "+905332857090",
  whatsappE164: "905332857090",
  email: "info@lagenyazilim.com.tr",
  address: {
    street: "Bayram Çıtak Sokak",
    neighborhood: "Harbiye Mahallesi",
    district: "Çankaya",
    city: "Ankara",
    postalCode: null,
  },
  openingHours: null,
  mapsUrl: null,
  social: [{ label: "Instagram", href: "https://www.instagram.com/lagenyazilim/" }],
};

export function formatAddress(b: BusinessInfo): string {
  const a = b.address;
  return [a.neighborhood, a.street, `${a.district} / ${a.city}`].filter(Boolean).join(", ");
}
