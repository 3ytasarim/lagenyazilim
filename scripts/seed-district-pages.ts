import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { and, eq, isNull, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { combinedText, evaluateRegionPage } from "../src/server/services/regions";

/*
 * İlçe sayfaları: src/content/data/district-pages/*.json → region_pages (serviceId = null).
 * - Var olan sayfa güncellenir, yoksa oluşturulur (idempotent).
 * - Yayın kapısı (evaluateRegionPage) 100 puan verirse yayımlanır; vermezse taslak kalır ve rapor yazdırılır.
 * - Yalnızca --publish verilirse yayın durumu değişir; varsayılan kuru çalıştırmadır (veritabanına yazmaz).
 * Çalıştırma: npx tsx --conditions react-server scripts/seed-district-pages.ts [--publish]
 */
type DistrictJson = {
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
  const dir = path.resolve("src/content/data/district-pages");
  const pages: DistrictJson[] = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const [city] = await db.select().from(schema.regions).where(and(eq(schema.regions.slug, "ankara"), isNull(schema.regions.parentId))).limit(1);
    if (!city) throw new Error("Ankara bölge kaydı yok — önce db:seed");
    const districts = await db.select().from(schema.regions).where(eq(schema.regions.parentId, city.id));
    const svc = await db.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
    const svcId = new Map(svc.map((s) => [s.slug, s.id]));

    // Kapı, aynı kümedeki diğer ilçe sayfalarıyla karşılaştırır (kopya engeli).
    const all = pages.map((p) => ({
      ...p,
      region: districts.find((d) => d.slug === p.slug),
      text: combinedText({ ...p, bodyHtml: "" }),
    }));

    let published = 0;
    for (const p of all) {
      if (!p.region) {
        console.log(`✗ ${p.slug}: bölge kaydı bulunamadı`);
        continue;
      }
      const related = p.relatedServices.map((s) => svcId.get(s)).filter((x): x is string => !!x);
      const others = all.filter((o) => o !== p && o.region).map((o) => ({ id: o.slug, label: o.name, text: o.text, seoTitle: o.seoTitle, h1: o.h1 }));
      // Hizmet+bölge kombinasyon sayfaları da benzerlik karşılaştırmasına girer
      const combos = await db
        .select({ id: schema.regionPages.id, title: schema.regionPages.title, h1: schema.regionPages.h1, seoTitle: schema.regionPages.seoTitle, intro: schema.regionPages.intro, localNeeds: schema.regionPages.localNeeds, localSectors: schema.regionPages.localSectors, serviceModel: schema.regionPages.serviceModel, bodyHtml: schema.regionPages.bodyHtml, faqs: schema.regionPages.faqs })
        .from(schema.regionPages)
        .where(ne(schema.regionPages.regionId, p.region.id));
      const comboOthers = combos.filter((c) => !all.some((a) => a.region && a.h1 === c.h1)).map((c) => ({ id: c.id, label: c.title, text: combinedText(c), seoTitle: c.seoTitle, h1: c.h1 }));

      const { score, report } = evaluateRegionPage(
        {
          title: p.name,
          h1: p.h1,
          intro: p.intro,
          localNeeds: p.localNeeds,
          localSectors: p.localSectors,
          serviceModel: p.serviceModel,
          bodyHtml: "",
          faqs: p.faqs,
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          relatedServiceIds: related,
          isServiceCombo: false,
        },
        { regionVerified: p.region.isVerified, regionNames: [p.name, "Ankara"], others: [...others, ...comboOthers] },
      );
      const ok = score === 100;
      console.log(`${ok ? "✓" : "✗"} ${p.slug.padEnd(16)} puan ${score}${ok ? "" : "  " + report.filter((r) => !r.ok).map((r) => r.message).join(" | ")}`);
      if (!WRITE) continue;

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
        qualityScore: score,
        qualityReport: report,
        robotsIndex: true,
        status: ok ? ("published" as const) : ("draft" as const),
        updatedAt: new Date(),
      };
      const [existing] = await db
        .select({ id: schema.regionPages.id, publishedAt: schema.regionPages.publishedAt })
        .from(schema.regionPages)
        .where(and(eq(schema.regionPages.regionId, p.region.id), isNull(schema.regionPages.serviceId)))
        .limit(1);
      const publishedAt = ok ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);
      if (existing) await db.update(schema.regionPages).set({ ...values, publishedAt }).where(eq(schema.regionPages.id, existing.id));
      else await db.insert(schema.regionPages).values({ regionId: p.region.id, serviceId: null, ...values, publishedAt });
      if (ok) published++;
    }
    console.log(WRITE ? `\n${published}/${all.length} sayfa yayımlandı.` : "\nKuru çalıştırma — yazmak için --publish");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
