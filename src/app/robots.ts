import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Public sayfalar taranabilir; admin, API ve iç arama sonuçları dışarıda.
 * Yapay zekâ arama tarayıcıları (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…) engellenmez — GEO hedefiyle uyumlu.
 * Admin ayrıca oturum + noindex ile korunur; robots.txt bir güvenlik önlemi değildir.
 */
export default function robots(): MetadataRoute.Robots {
  // Yalnızca gerçek alan adında taranabilir; staging/yerel kurulumlar (farklı host) otomatik olarak kapalı
  const local = new URL(absoluteUrl("/")).hostname !== "www.lagenyazilim.com.tr" || process.env.ROBOTS_DISALLOW === "1";
  return {
    rules: local ? [{ userAgent: "*", disallow: "/" }] : [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/blog/?q="] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
