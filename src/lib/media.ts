/** Medya URL yardımcıları (istemci ve sunucuda kullanılabilir). */
export type MediaRef = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  variants: Record<string, string>;
  blurDataUrl?: string | null;
};

export const mediaUrl = (key: string) => `/media/${key}`;

/** En büyük varyant `url`, diğerleri srcset. */
export function srcSet(variants: Record<string, string>): string {
  return Object.entries(variants)
    .map(([w, key]) => [Number(w), key] as const)
    .filter(([w]) => Number.isFinite(w))
    .sort((a, b) => a[0] - b[0])
    .map(([w, key]) => `${mediaUrl(key)} ${w}w`)
    .join(", ");
}

export const MEDIA_WIDTHS = [480, 960, 1600] as const;
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/avif"];
