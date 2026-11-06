import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, mediaAssets, pages, projects, redirectRules, regionPages, regions, services } from "@/lib/db/schema";
import { normalizePath } from "@/lib/redirects/legacy";
import { regionPath } from "@/lib/regions";
import { SITEMAP_TYPES, sitemapEntries } from "./sitemap";

export type AuditItem = {
  type: "Hizmet" | "Yazı" | "Sayfa" | "Proje" | "Bölge";
  label: string;
  path: string;
  editHref: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalOverride: string | null;
  robotsIndex: boolean;
  textLength: number;
  html: string;
  fallbackTitle: string;
};

export type Issue = { severity: "error" | "warning" | "info"; code: string; message: string; item?: Pick<AuditItem, "type" | "label" | "path" | "editHref"> };

const STATIC_ROUTES = ["/", "/hizmetlerimiz/", "/cozumler/", "/hakkimizda/", "/iletisim/", "/proje-teklifi/", "/ucretsiz-seo-analizi/", "/hizmet-bolgeleri/", "/hizmet-bolgeleri/ankara/", "/blog/", "/projeler/"];
const textLen = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;

async function collect(): Promise<AuditItem[]> {
  const [svc, posts, pg, prj, rp] = await Promise.all([
    db.select().from(services),
    db.select().from(blogPosts),
    db.select().from(pages),
    db.select().from(projects),
    db
      .select({ p: regionPages, r: regions, parentSlug: sql<string | null>`(select slug from regions x where x.id = ${regions.parentId} and x.kind = 'district')`, serviceSlug: sql<string | null>`(select slug from services s where s.id = ${regionPages.serviceId})` })
      .from(regionPages)
      .innerJoin(regions, eq(regionPages.regionId, regions.id)),
  ]);
  return [
    ...svc.map((s) => ({ type: "Hizmet" as const, label: s.name, path: `/${s.slug}/`, editHref: `/admin/hizmetler/${s.id}/`, status: s.status, seoTitle: s.seoTitle, seoDescription: s.seoDescription, canonicalOverride: s.canonicalOverride, robotsIndex: s.robotsIndex, textLength: (s.shortAnswer + s.problem + s.approach).length + textLen(s.bodyHtml), html: s.bodyHtml, fallbackTitle: s.h1 })),
    ...posts.map((p) => ({ type: "Yazı" as const, label: p.title, path: `/blog/${p.slug}/`, editHref: `/admin/blog/${p.id}/`, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription, canonicalOverride: p.canonicalOverride, robotsIndex: p.robotsIndex, textLength: textLen(p.bodyHtml), html: p.bodyHtml, fallbackTitle: p.title })),
    ...pg.map((p) => ({ type: "Sayfa" as const, label: p.title, path: `/${p.slug}/`, editHref: `/admin/sayfalar/${p.id}/`, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription, canonicalOverride: p.canonicalOverride, robotsIndex: p.robotsIndex && !p.requiresLegalReview, textLength: p.slug === "hakkimizda" ? 999 : textLen(p.bodyHtml), html: p.bodyHtml, fallbackTitle: p.title })),
    ...prj.map((p) => ({ type: "Proje" as const, label: p.title, path: `/projeler/${p.slug}/`, editHref: `/admin/projeler/${p.id}/`, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription, canonicalOverride: p.canonicalOverride, robotsIndex: p.robotsIndex, textLength: (p.summary + p.challenge + p.solution).length + textLen(p.bodyHtml), html: p.bodyHtml, fallbackTitle: p.title })),
    ...rp.map(({ p, r, parentSlug, serviceSlug }) => ({ type: "Bölge" as const, label: p.title, path: regionPath(r, parentSlug, serviceSlug), editHref: `/admin/bolgeler/sayfa/${p.id}/`, status: p.status, seoTitle: p.seoTitle, seoDescription: p.seoDescription, canonicalOverride: p.canonicalOverride, robotsIndex: p.robotsIndex, textLength: (p.intro + p.localNeeds + p.localSectors + p.serviceModel).length + textLen(p.bodyHtml), html: p.bodyHtml, fallbackTitle: p.h1 })),
  ];
}

/** SEO kontrol merkezi — yalnızca site içi veriden hesaplanır; dış sıralama verisi gösterilmez. */
export async function runSeoAudit() {
  const items = await collect();
  const live = items.filter((i) => i.status === "published");
  const issues: Issue[] = [];
  const ref = (i: AuditItem) => ({ type: i.type, label: i.label, path: i.path, editHref: i.editHref });

  for (const i of live) {
    const title = (i.seoTitle ?? "").trim();
    const desc = (i.seoDescription ?? "").trim();
    if (!title) issues.push({ severity: "warning", code: "title-missing", message: `SEO başlığı yok; "${i.fallbackTitle}" kullanılıyor.`, item: ref(i) });
    else if (title.length > 65) issues.push({ severity: "warning", code: "title-long", message: `SEO başlığı ${title.length} karakter (önerilen ≤ 60).`, item: ref(i) });
    else if (title.length < 25) issues.push({ severity: "info", code: "title-short", message: `SEO başlığı kısa (${title.length} karakter).`, item: ref(i) });
    if (!desc) issues.push({ severity: "warning", code: "desc-missing", message: "Meta açıklama yok.", item: ref(i) });
    else if (desc.length > 170 || desc.length < 70) issues.push({ severity: "info", code: "desc-length", message: `Meta açıklama ${desc.length} karakter (önerilen 120–160).`, item: ref(i) });
    if (i.canonicalOverride && i.canonicalOverride !== i.path) issues.push({ severity: "warning", code: "canonical", message: `Canonical başka bir adresi gösteriyor: ${i.canonicalOverride}. Sayfa sitemap'e girmez.`, item: ref(i) });
    if (!i.robotsIndex) issues.push({ severity: "info", code: "noindex", message: "Yayında ama noindex.", item: ref(i) });
    if (i.textLength < 200) issues.push({ severity: "warning", code: "thin", message: "İçerik çok kısa veya boş.", item: ref(i) });
  }

  // Tekrarlayan başlıklar (yayındaki içerikler arasında)
  const byTitle = new Map<string, AuditItem[]>();
  for (const i of live) {
    const t = (i.seoTitle || i.fallbackTitle).trim().toLowerCase();
    byTitle.set(t, [...(byTitle.get(t) ?? []), i]);
  }
  for (const [, list] of byTitle) if (list.length > 1) for (const i of list) issues.push({ severity: "error", code: "title-duplicate", message: `Aynı başlık ${list.length} sayfada: ${list.map((x) => x.path).join(", ")}`, item: ref(i) });

  // Kırık iç bağlantılar: içerik gövdelerindeki /yol/ bağlantıları bilinen canlı yollarla karşılaştırılır
  const known = new Set([...STATIC_ROUTES, ...live.map((i) => i.path)]);
  const redirects = new Map((await db.select({ from: redirectRules.fromPath, to: redirectRules.toPath, status: redirectRules.statusCode }).from(redirectRules).where(eq(redirectRules.isActive, true))).map((r) => [r.from, r]));
  for (const i of items.filter((x) => x.status !== "archived")) {
    for (const m of i.html.matchAll(/href="(\/[^"#?]*)/g)) {
      const p = normalizePath(m[1]!);
      if (known.has(p) || p.startsWith("/media/")) continue;
      const r = redirects.get(p);
      issues.push(r ? { severity: "info", code: "link-redirect", message: `Bağlantı yönlendirilen adrese gidiyor: ${p} → ${r.status === 410 ? "410" : r.to}`, item: ref(i) } : { severity: "error", code: "link-broken", message: `Kırık iç bağlantı: ${p}`, item: ref(i) });
    }
  }

  const [media] = await db.select({ total: sql<number>`count(*)::int`, missing: sql<number>`count(*) filter (where ${mediaAssets.alt} = '')::int` }).from(mediaAssets);
  if ((media?.missing ?? 0) > 0) issues.push({ severity: "warning", code: "alt-missing", message: `${media!.missing} görselin alt metni eksik.`, item: { type: "Sayfa", label: "Medya kütüphanesi", path: "", editHref: "/admin/medya/" } });

  const sitemap = await Promise.all(SITEMAP_TYPES.map(async (t) => ({ type: t, count: (await sitemapEntries(t)).length })));
  const counts = {
    published: live.length,
    drafts: items.filter((i) => i.status === "draft" || i.status === "review").length,
    errors: issues.filter((i) => i.severity === "error").length,
    warnings: issues.filter((i) => i.severity === "warning").length,
    mediaTotal: media?.total ?? 0,
  };
  return { issues, sitemap, counts, drafts: items.filter((i) => i.status === "draft" || i.status === "review").map(ref) };
}
