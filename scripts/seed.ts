import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { LEGAL_DOCS, type LegalDoc } from "../src/content/legal";
import { BUDGET_RANGES, QUOTE_SERVICE_OPTIONS } from "../src/content/quote";
import { NEIGHBORHOOD_SEED } from "../src/content/neighborhoods";
import { DISTRICT_SEED } from "../src/content/regions";
import { SERVICE_SEO } from "../src/content/seo";
import { SERVICES } from "../src/content/services";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_BUSINESS } from "../src/lib/site";

/*
 * Başlangıç verisi. Idempotent: yalnızca eksik kayıtları ekler (ON CONFLICT DO NOTHING),
 * mevcut satırları güncellemez veya silmez — üretimde tekrar çalıştırmak güvenlidir.
 * Kullanıcı / admin hesabı OLUŞTURMAZ (bkz. scripts/create-admin.ts).
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function legalHtml(doc: LegalDoc) {
  return doc.sections
    .map((s) => `<h2>${esc(s.h)}</h2>${(s.p ?? []).map((p) => `<p>${esc(p)}</p>`).join("")}${s.list ? `<ul>${s.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}`)
    .join("");
}

const CATEGORIES = [
  { slug: "web-tasarim", name: "Web Tasarım" },
  { slug: "seo", name: "SEO ve GEO" },
  { slug: "yazilim", name: "Yazılım" },
  { slug: "dijital-pazarlama", name: "Dijital Pazarlama" },
  { slug: "katalog-ve-gorsel", name: "Katalog ve Görsel" },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const now = new Date();
  const log = (label: string, n: number) => console.log(`  ${label}: ${n} yeni`);

  try {
    // Site ayarları
    const s = await db
      .insert(schema.siteSettings)
      .values([
        { key: "business", value: DEFAULT_BUSINESS },
        { key: "seo", value: { googleSiteVerification: "", bingSiteVerification: "", gbpUrl: "" } },
        { key: "analytics", value: { provider: "none", ga4Id: "", umamiUrl: "", umamiSiteId: "" } },
      ])
      .onConflictDoNothing()
      .returning();
    log("site_settings", s.length);

    // Hizmetler
    const sv = await db
      .insert(schema.services)
      .values(
        SERVICES.map((x) => ({
          slug: x.slug,
          name: x.name,
          shortName: x.shortName,
          h1: x.h1,
          summary: x.summary,
          heroText: x.heroText,
          shortAnswer: x.shortAnswer,
          icon: x.icon,
          problem: x.problem,
          approach: x.approach,
          scope: x.scope,
          deliverables: x.deliverables,
          sectors: x.sectors,
          process: x.process,
          faqs: x.faqs,
          quoteKey: x.quoteKey,
          isCore: true,
          sortOrder: x.sortOrder,
          status: "published" as const,
          publishedAt: now,
          // Meta alanları anahtar kelime haritasından (docs/keyword-research.md)
          seoTitle: SERVICE_SEO[x.slug]?.seoTitle ?? x.seoTitle,
          seoDescription: SERVICE_SEO[x.slug]?.seoDescription ?? x.seoDescription,
          focusKeyword: SERVICE_SEO[x.slug]?.focusKeyword ?? null,
          secondaryKeywords: SERVICE_SEO[x.slug]?.secondaryKeywords ?? [],
        })),
      )
      .onConflictDoNothing()
      .returning({ id: schema.services.id });
    log("services", sv.length);

    const all = await db.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
    const idOf = new Map(all.map((r) => [r.slug, r.id]));
    const rel = SERVICES.flatMap((x) =>
      x.related.map((r, i) => ({ serviceId: idOf.get(x.slug)!, relatedId: idOf.get(r)!, sortOrder: i })).filter((r) => r.serviceId && r.relatedId),
    );
    const rr = await db.insert(schema.serviceRelations).values(rel).onConflictDoNothing().returning();
    log("service_relations", rr.length);

    // Teklif seçenekleri
    const qo = await db
      .insert(schema.quoteServiceOptions)
      .values(QUOTE_SERVICE_OPTIONS.map((o, i) => ({ key: o.key, label: o.label, description: o.description, extraFields: o.extraFields, sortOrder: i })))
      .onConflictDoNothing()
      .returning();
    log("quote_service_options", qo.length);

    const existingBudgets = await db.select({ id: schema.budgetRanges.id }).from(schema.budgetRanges).limit(1);
    if (existingBudgets.length === 0) {
      const BOUNDS: Record<string, [number | null, number | null]> = {
        belirsiz: [null, null],
        "100k-alti": [null, 100000],
        "100k-250k": [100000, 250000],
        "250k-500k": [250000, 500000],
        "500k-ustu": [500000, null],
      };
      const b = await db
        .insert(schema.budgetRanges)
        .values(BUDGET_RANGES.map((r, i) => ({ label: r.label, minTry: BOUNDS[r.id]?.[0] ?? null, maxTry: BOUNDS[r.id]?.[1] ?? null, sortOrder: i })))
        .returning();
      log("budget_ranges", b.length);
    } else log("budget_ranges", 0);

    // Bölgeler: Ankara + 25 ilçe
    let [ankara] = await db
      .select()
      .from(schema.regions)
      .where(and(eq(schema.regions.slug, "ankara"), isNull(schema.regions.parentId)));
    if (!ankara) {
      [ankara] = await db
        .insert(schema.regions)
        .values({ kind: "city", slug: "ankara", name: "Ankara", isVerified: true, verificationSource: "İl", priority: 1 })
        .returning();
    }
    const ds = await db
      .insert(schema.regions)
      .values(
        DISTRICT_SEED.map(([slug, name, priority]) => ({
          parentId: ankara!.id,
          kind: "district" as const,
          slug,
          name,
          priority,
          isVerified: true,
          verificationSource: "Ankara'nın 25 ilçesi (idari yapı)",
        })),
      )
      .onConflictDoNothing()
      .returning();
    log("regions (ilçe)", ds.length);

    // Doğrulanmış mahalle / semt kayıtları (docs/neighborhood-verification.md)
    const districtRows = await db.select({ id: schema.regions.id, slug: schema.regions.slug }).from(schema.regions).where(eq(schema.regions.parentId, ankara!.id));
    const districtId = new Map(districtRows.map((d) => [d.slug, d.id]));
    const nb = await db
      .insert(schema.regions)
      .values(
        NEIGHBORHOOD_SEED.filter((n) => districtId.has(n.district)).map((n) => ({
          parentId: districtId.get(n.district)!,
          kind: n.kind,
          slug: n.slug,
          name: n.name,
          isVerified: n.verified,
          verificationSource: n.source,
          priority: n.slug === "harbiye" ? 1 : 2,
        })),
      )
      .onConflictDoNothing()
      .returning();
    log("regions (mahalle/semt)", nb.length);

    // Sayfalar
    const pg = await db
      .insert(schema.pages)
      .values([
        {
          slug: "hakkimizda",
          kind: "corporate",
          title: "Ankara'dan, işini büyütmek isteyen markalar için",
          excerpt:
            "Lagen Yazılım; web tasarım, özel yazılım ve dijital pazarlama alanlarında Ankara merkezli çalışan bir ekiptir. İşletmelerin dijitaldeki varlığını; güzel görünen ama tek başına duran parçalar yerine birbirini besleyen bir bütün olarak kuruyoruz.",
          status: "published" as const,
          publishedAt: now,
          seoTitle: "Hakkımızda: Ankara Merkezli Web ve Yazılım Ekibi",
          seoDescription:
            "Lagen Yazılım; Çankaya'daki ofisinden web tasarım, özel yazılım, SEO ve dijital pazarlama hizmetleri sunan Ankara merkezli bir ekip. Nasıl çalıştığımızı inceleyin.",
        },
        ...LEGAL_DOCS.map((d) => ({
          slug: d.slug,
          kind: "legal",
          title: d.title,
          excerpt: d.description,
          bodyHtml: legalHtml(d),
          requiresLegalReview: true,
          version: d.version,
          status: "published" as const,
          publishedAt: now,
          seoTitle: d.title,
          seoDescription: d.description,
          robotsIndex: false,
        })),
      ])
      .onConflictDoNothing()
      .returning();
    log("pages", pg.length);

    const bc = await db
      .insert(schema.blogCategories)
      .values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
      .onConflictDoNothing()
      .returning();
    log("blog_categories", bc.length);

    console.log("✓ Seed tamamlandı.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
