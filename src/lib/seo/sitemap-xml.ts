import { absoluteUrl } from "@/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Görsel site haritası uzantısı (Google Images): sayfadaki ana görseller <image:image> olarak eklenir. */
export function urlsetXml(entries: { path: string; lastmod?: Date; images?: string[] }[]): string {
  const body = entries
    .map(
      (e) =>
        `<url><loc>${esc(absoluteUrl(e.path))}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ""}${(e.images ?? [])
          .map((src) => `<image:image><image:loc>${esc(absoluteUrl(src))}</image:loc></image:image>`)
          .join("")}</url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;
}

export function indexXml(items: { path: string; lastmod?: Date }[]): string {
  const body = items.map((i) => `<sitemap><loc>${esc(absoluteUrl(i.path))}</loc>${i.lastmod ? `<lastmod>${i.lastmod.toISOString()}</lastmod>` : ""}</sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

export const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=600" };
