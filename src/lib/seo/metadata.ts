import type { Metadata } from "next";
import { SITE_LOCALE, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

type BuildMetadataInput = {
  /** Sayfa yolu, sonda "/" ile: "/ankara-web-tasarim/" */
  path: string;
  title: string;
  description: string;
  /** Başlığa " | Lagen Yazılım" eki eklenmesin (başlık zaten markayı içeriyorsa). */
  absoluteTitle?: boolean;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  type?: "website" | "article";
  index?: boolean;
  follow?: boolean;
  canonicalOverride?: string | null;
  publishedTime?: string;
  modifiedTime?: string;
  /** meta keywords (Google sıralamada kullanmaz; Bing/Yandex ve iç arama için tutarlı anahtar kelime seti) */
  keywords?: string[];
};

const DEFAULT_OG_IMAGE = { url: "/opengraph-image/", width: 1200, height: 630, alt: "Lagen Yazılım" };
const TITLE_MAX = 60;
const BRAND_SUFFIX = ` | ${SITE_NAME}`;

/** Marka ekiyle 60 karakteri aşan başlıklarda ek düşürülür; başlığın kendisi kısaltılmaz. */
export function fitTitle(title: string, absolute = false): string {
  if (absolute || title.includes(SITE_NAME)) return title;
  const withBrand = title + BRAND_SUFFIX;
  return withBrand.length <= TITLE_MAX ? withBrand : title;
}

/**
 * Canonical override yalnızca aynı host'a izin verir; aksi halde sayfanın kendi URL'si kullanılır.
 * (Admin'den hatalı çapraz domain canonical girilmesine karşı ikinci savunma hattı.)
 */
export function resolveCanonical(path: string, override?: string | null): string {
  if (override) {
    try {
      const url = new URL(override, SITE_URL);
      if (url.origin === new URL(SITE_URL).origin) return url.toString();
    } catch {
      /* geçersiz override yok sayılır */
    }
  }
  return absoluteUrl(path);
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = fitTitle(input.title, input.absoluteTitle);
  const canonical = resolveCanonical(input.path, input.canonicalOverride);
  const index = input.index ?? true;
  const follow = input.follow ?? true;
  // Sayfaya özel görsel yoksa varsayılan marka görseli (app/opengraph-image.tsx)
  const image = input.image ?? DEFAULT_OG_IMAGE;
  const images = [{ ...image, url: absoluteUrl(image.url) }];

  return {
    title: { absolute: title },
    description: input.description,
    ...(input.keywords?.length ? { keywords: input.keywords } : {}),
    alternates: { canonical },
    robots: {
      index,
      follow,
      googleBot: { index, follow, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    openGraph: {
      type: input.type ?? "website",
      locale: SITE_LOCALE,
      siteName: SITE_NAME,
      url: canonical,
      title,
      description: input.description,
      images,
      ...(input.type === "article" && input.publishedTime
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime ?? input.publishedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: input.description,
      images: images.map((i) => i.url),
    },
  };
}
