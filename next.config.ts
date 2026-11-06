import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production" && process.env.SITE_URL_ALLOW_INSECURE !== "1";

/**
 * Content-Security-Policy. Sayfalar statik üretildiği için nonce yerine 'unsafe-inline' (yalnızca Next'in kendi
 * hidrasyon betikleri için) kullanılır; dış betik kaynakları açıkça listelenir. Analitik açılırsa
 * GA4 alanları veya UMAMI_ORIGIN eklenir. eval, object, base ve framing kapalı.
 */
function csp(): string {
  const umami = process.env.UMAMI_ORIGIN ? ` ${process.env.UMAMI_ORIGIN}` : "";
  const ga = "https://www.googletagmanager.com";
  const gaConnect = "https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${ga}${umami}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://www.google-analytics.com https://*.googletagmanager.com",
    "font-src 'self'",
    `connect-src 'self' ${gaConnect}${umami}`,
    "frame-src https://www.youtube-nocookie.com",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // HSTS yalnızca üretimde (HTTPS arkasında); Nginx de aynı başlığı gönderebilir
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // Eski sitenin URL biçimi korunur: /ankara-web-tasarim/
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Teklif ekleri (3 × 10 MB) ve medya yüklemeleri için; Nginx client_max_body_size ile uyumlu tutulmalı
    serverActions: { bodySizeLimit: "40mb" },
    proxyClientMaxBodySize: "40mb",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
