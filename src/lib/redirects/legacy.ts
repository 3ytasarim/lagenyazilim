/**
 * Eski WordPress sitesinin URL kuralları (kaynak: docs/redirect-map.csv, docs/legacy-url-audit.md).
 * - Karşılığı olan sayfalar birebir 301 ile taşınır.
 * - Tema demo içerikleri ve WordPress sistem uçları 410 Gone döner (rastgele ana sayfaya yönlendirme yapılmaz).
 * Hizmet URL'leri (/ankara-web-tasarim/ vb.) aynen korunduğu için burada yer almaz.
 */

export const LEGACY_REDIRECTS: Record<string, string> = {
  "/blog-2/": "/blog/",
  "/sitemap_index.xml": "/sitemap.xml",
  "/wp-sitemap.xml": "/sitemap.xml",
  "/page-sitemap.xml": "/sitemap.xml",
  "/post-sitemap.xml": "/sitemap.xml",
  "/product-sitemap.xml": "/sitemap.xml",
  "/team-sitemap.xml": "/sitemap.xml",
  "/portfolio-sitemap.xml": "/sitemap.xml",
};

// Fotoğraf ve drone çekimi hizmeti verilmiyor (2026-11): eski hizmet adresi 410.
const GONE_EXACT = new Set(["/ankara-fotograf-cekimi/", "/shop/", "/checkout/", "/cart/", "/my-account/", "/feed/", "/comments/feed/", "/wp-login.php", "/xmlrpc.php", "/wp-cron.php"]);

const GONE_PREFIXES = ["/product/", "/portfolio/", "/team/", "/product-category/", "/product-tag/", "/category/", "/tag/", "/author/", "/wp-admin/", "/wp-json/", "/wp-content/", "/wp-includes/", "/shop/"];

/** "/Blog-2" → "/blog-2/" ; dosya uzantılı yollara "/" eklenmez. */
export function normalizePath(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    /* bozuk kodlama: olduğu gibi */
  }
  p = p.toLowerCase().replace(/\/{2,}/g, "/");
  if (!/\.[a-z0-9]{2,5}$/.test(p) && !p.endsWith("/")) p += "/";
  return p;
}

export type LegacyDecision = { type: "redirect"; to: string; status: 301 } | { type: "gone" } | null;

export function legacyDecision(pathname: string): LegacyDecision {
  const p = normalizePath(pathname);
  const to = LEGACY_REDIRECTS[p];
  if (to) return { type: "redirect", to, status: 301 };
  if (GONE_EXACT.has(p) || GONE_PREFIXES.some((pre) => p.startsWith(pre))) return { type: "gone" };
  return null;
}
