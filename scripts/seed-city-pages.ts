import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { districtKeywords } from "../src/content/seo";
import * as schema from "../src/lib/db/schema";
import { combinedText, evaluateRegionPage } from "../src/server/services/regions";

/*
 * İl sayfaları (Türkiye geneli): src/content/data/city-pages/*.json → regions (kind=city) + region_pages.
 * - İl kaydı yoksa oluşturulur (resmî il adı; doğrulanmış idari birim).
 * - Yayın kapısı (evaluateRegionPage) diğer il sayfaları ve Ankara ilçe sayfalarıyla karşılaştırarak çalışır; 100 puan → yayın.
 * - Odak/ikincil anahtar kelimeler src/content/seo.ts kalıbından.
 * Varsayılan kuru çalıştırma; yazmak için --publish.
 * Çalıştırma: npx tsx --conditions react-server scripts/seed-city-pages.ts [--publish]
 */
type CityJson = {
  slug: string;
  name: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
  localNeeds: string;
  localSectors: string;
  serviceModel: string;
  faqs: { q: string; a: string }[];
  relatedServices: string[];
};

const WRITE = process.argv.includes("--publish");

async function main() {
  const dir = path.resolve("src/content/data/city-pages");
  const pages: CityJson[] = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const svc = await db.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
    const svcId = new Map(svc.map((s) => [s.slug, s.id]));

    // Karşılaştırma kümesi: diğer il sayfaları + yayındaki tüm bölge sayfaları (ilçe şablon kopyası da yakalansın)
    const existing = await db
      .select({ id: schema.regionPages.id, title: schema.regionPages.title, h1: schema.regionPages.h1, seoTitle: schema.regionPages.seoTitle, intro: schema.regionPages.intro, localNeeds: schema.regionPages.localNeeds, localSectors: schema.regionPages.localSectors, serviceModel: schema.regionPages.serviceModel, bodyHtml: schema.regionPages.bodyHtml, faqs: schema.regionPages.faqs, regionSlug: schema.regions.slug, kind: schema.regions.kind })
      .from(schema.regionPages)
      .innerJoin(schema.regions, eq(schema.regions.id, schema.regionPages.regionId));
    const cityTexts = pages.map((p) => ({ id: p.slug, label: p.name, text: combinedText({ ...p, bodyHtml: "" }), seoTitle: p.seoTitle, h1: p.h1 }));

    let published = 0;
    for (const [i, p] of pages.entries()) {
      const related = p.relatedServices.map((s) => svcId.get(s)).filter((x): x is string => !!x);
      const others = [
        ...cityTexts.filter((c) => c.id !== p.slug),
        ...existing.filter((e) => !(e.kind === "city" && e.regionSlug === p.slug)).map((e) => ({ id: e.id, label: e.title, text: combinedText(e), seoTitle: e.seoTitle, h1: e.h1 })),
      ];
      const { score, report } = evaluateRegionPage(
        { title: p.name, h1: p.h1, intro: p.intro, localNeeds: p.localNeeds, localSectors: p.localSectors, serviceModel: p.serviceModel, bodyHtml: "", faqs: p.faqs, seoTitle: p.seoTitle, seoDescription: p.seoDescription, relatedServiceIds: related, isServiceCombo: false },
        { regionVerified: true, regionNames: [p.name, "Ankara", "Türkiye"], others },
      );
      const ok = score === 100;
      console.log(`${ok ? "✓" : "✗"} ${p.slug.padEnd(12)} puan ${score}${ok ? "" : "  " + report.filter((r) => !r.ok).map((r) => r.message).join(" | ")}`);
      if (!WRITE) continue;

      let [region] = await db.select().from(schema.regions).where(and(eq(schema.regions.slug, p.slug), isNull(schema.regions.parentId))).limit(1);
      if (!region) {
        [region] = await db
          .insert(schema.regions)
          .values({ kind: "city", slug: p.slug, name: p.name, isVerified: true, verificationSource: "Türkiye'nin 81 ili (idari yapı)", priority: 2 + i })
          .returning();
      }
      const kw = districtKeywords(p.name, p.relatedServices);
      const values = {
        title: p.name,
        h1: p.h1,
        intro: p.intro,
        localNeeds: p.localNeeds,
        localSectors: p.localSectors,
        serviceModel: p.serviceModel,
        bodyHtml: "",
        faqs: p.faqs,
        relatedServiceIds: related,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        focusKeyword: kw.focusKeyword,
        secondaryKeywords: kw.secondaryKeywords,
        qualityScore: score,
        qualityReport: report,
        robotsIndex: true,
        status: ok ? ("published" as const) : ("draft" as const),
        updatedAt: new Date(),
      };
      const [cur] = await db
        .select({ id: schema.regionPages.id, publishedAt: schema.regionPages.publishedAt })
        .from(schema.regionPages)
        .where(and(eq(schema.regionPages.regionId, region!.id), isNull(schema.regionPages.serviceId)))
        .limit(1);
      const publishedAt = ok ? (cur?.publishedAt ?? new Date()) : (cur?.publishedAt ?? null);
      if (cur) await db.update(schema.regionPages).set({ ...values, publishedAt }).where(eq(schema.regionPages.id, cur.id));
      else await db.insert(schema.regionPages).values({ regionId: region!.id, serviceId: null, ...values, publishedAt });
      if (ok) published++;
    }
    console.log(WRITE ? `\n${published}/${pages.length} il sayfası yayımlandı.` : "\nKuru çalıştırma — yazmak için --publish");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
