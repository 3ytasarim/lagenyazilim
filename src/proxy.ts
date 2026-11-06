import { NextResponse, type NextRequest } from "next/server";
import { legacyDecision, normalizePath } from "@/lib/redirects/legacy";
import { countHit, findRedirect } from "@/lib/redirects/store";

const SESSION_COOKIE = "lagen_admin";
const PUBLIC_ADMIN = ["/admin/giris", "/admin/sifre-sifirla"];
const SITE = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lagenyazilim.com.tr");

const GONE_HTML = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sayfa kaldırıldı | Lagen Yazılım</title><style>body{font-family:system-ui,sans-serif;background:#f6f5f1;color:#0e1530;margin:0;display:grid;place-items:center;min-height:100vh}main{max-width:520px;padding:24px}a{color:#1a3fb5;font-weight:600}</style></head><body><main><p style="color:#1a3fb5;font-weight:600">410</p><h1>Bu sayfa kalıcı olarak kaldırıldı</h1><p>Aradığınız içerik artık yayında değil.</p><p><a href="/">Ana sayfaya dönün</a> · <a href="/hizmetlerimiz/">Hizmetlerimiz</a> · <a href="/iletisim/">İletişim</a></p></main></body></html>`;

/**
 * Next 16 proxy (eski adıyla middleware). Sıra:
 * 1) Tek host: üretimde www olmayan / farklı host istekleri SITE_URL host'una 301 (Nginx de yapar; güvenlik ağı)
 * 2) /admin: oturum çerezi yoksa girişe yönlendirme (yalnızca kolaylık — asıl yetki sunucuda requireUser ile)
 * 3) Eski WordPress URL'leri: birebir 301 veya 410 Gone
 * 4) Admin › SEO › Yönlendirmeler tablosu (slug değişikliğinde otomatik oluşanlar dahil)
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (process.env.NODE_ENV === "production") {
    const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
    if (host && host !== SITE.hostname && host.endsWith(SITE.hostname.replace(/^www\./, ""))) {
      return NextResponse.redirect(new URL(pathname + search, SITE), 301);
    }
  }

  if (pathname.startsWith("/admin")) {
    const open = PUBLIC_ADMIN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!open && !request.cookies.has(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/giris/";
      url.search = pathname === "/admin" || pathname === "/admin/" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const legacy = legacyDecision(pathname);
  if (legacy?.type === "redirect") return NextResponse.redirect(new URL(legacy.to + search, request.nextUrl.origin), legacy.status);
  if (legacy?.type === "gone") {
    return new NextResponse(GONE_HTML, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=3600" } });
  }

  const path = normalizePath(pathname);
  const rule = await findRedirect(path);
  if (rule) {
    countHit(path);
    if (rule.status === 410) return new NextResponse(GONE_HTML, { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } });
    const target = new URL(rule.to, request.nextUrl.origin);
    if (!target.search && search) target.search = search;
    return NextResponse.redirect(target, rule.status === 302 ? 302 : rule.status === 308 ? 308 : 301);
  }
  return NextResponse.next();
}

export const config = {
  // Statik dosyalar, medya ve Next iç yolları hariç her şey
  matcher: ["/((?!_next/|media/|brand/|favicon.ico|icon.png|apple-icon.png|opengraph-image).*)"],
};
