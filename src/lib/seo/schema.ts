import { SITE_NAME, SITE_URL, absoluteUrl, type BusinessInfo } from "@/lib/site";
import type { FaqItem, Service } from "@/types/content";

/* JSON-LD üreticileri. Görünür içerikle tutarlı olmayan hiçbir alan (puan, yorum, ek adres) üretilmez. */

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const BUSINESS_ID = `${SITE_URL}/#business`;

type Json = Record<string, unknown>;

export function organizationSchema(b: BusinessInfo): Json {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: b.name,
    ...(b.legalName ? { legalName: b.legalName } : {}),
    url: absoluteUrl("/"),
    logo: { "@type": "ImageObject", url: absoluteUrl("/brand/lagen-logo.png"), width: 705, height: 240 },
    email: b.email,
    telephone: b.phoneE164,
    sameAs: b.social.map((s) => s.href),
  };
}

export function websiteSchema(): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: SITE_NAME,
    inLanguage: "tr-TR",
    publisher: { "@id": ORG_ID },
  };
}

/** Tek fiziksel ofis. Diğer ilçeler yalnızca areaServed olarak listelenir. */
export function professionalServiceSchema(b: BusinessInfo, areaServed: string[]): Json {
  return {
    "@type": "ProfessionalService",
    "@id": BUSINESS_ID,
    name: b.name,
    url: absoluteUrl("/"),
    image: absoluteUrl("/brand/lagen-logo.png"),
    telephone: b.phoneE164,
    email: b.email,
    parentOrganization: { "@id": ORG_ID },
    address: {
      "@type": "PostalAddress",
      streetAddress: `${b.address.neighborhood}, ${b.address.street}`,
      addressLocality: b.address.district,
      addressRegion: b.address.city,
      ...(b.address.postalCode ? { postalCode: b.address.postalCode } : {}),
      addressCountry: "TR",
    },
    areaServed: areaServed.map((name) => (name === "Türkiye" ? { "@type": "Country", name } : { "@type": "AdministrativeArea", name })),
    ...(b.openingHours ? { openingHours: b.openingHours } : {}),
    ...(b.mapsUrl ? { hasMap: b.mapsUrl } : {}),
  };
}

export function serviceSchema(s: Service, path: string): Json {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name: s.name,
    serviceType: s.name,
    description: s.shortAnswer,
    url: absoluteUrl(path),
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Türkiye" },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}

/** Yalnızca sayfada görünen SSS için. Zengin sonuç gösterimi garanti değildir. */
export function faqSchema(faqs: FaqItem[]): Json | null {
  if (faqs.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function graph(...nodes: (Json | null | undefined)[]): Json {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}
