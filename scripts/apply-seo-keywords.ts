import "dotenv/config";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SERVICE_SEO, districtKeywords } from "../src/content/seo";
import * as schema from "../src/lib/db/schema";

/*
 * Anahtar kelime haritasını (src/content/seo.ts, docs/keyword-research.md) veritabanına yazar:
 * - Hizmetler: seoTitle, seoDescription, focusKeyword, secondaryKeywords
 * - İlçe sayfaları: focusKeyword, secondaryKeywords (ilçe adı + ilgili hizmetler)
 * Yalnızca bu alanlara dokunur. Varsayılan kuru çalıştırma; yazmak için --apply.
 */
const APPLY = process.argv.includes("--apply");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const svc = await db.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
    const slugOf = new Map(svc.map((s) => [s.id, s.slug]));
    for (const s of svc) {
      const m = SERVICE_SEO[s.slug];
      if (!m) continue;
      console.log(`hizmet ${s.slug}: "${m.seoTitle}" (${m.seoTitle.length}) · odak "${m.focusKeyword}"`);
      if (APPLY) await db.update(schema.services).set({ ...m, updatedAt: new Date() }).where(eq(schema.services.id, s.id));
    }

    const [city] = await db.select().from(schema.regions).where(and(eq(schema.regions.slug, "ankara"), isNull(schema.regions.parentId))).limit(1);
    const districts = await db.select().from(schema.regions).where(eq(schema.regions.parentId, city!.id));
    const pages = await db
      .select({ id: schema.regionPages.id, regionId: schema.regionPages.regionId, related: schema.regionPages.relatedServiceIds })
      .from(schema.regionPages)
      .where(and(isNull(schema.regionPages.serviceId), inArray(schema.regionPages.regionId, districts.map((d) => d.id))));
    for (const p of pages) {
      const d = districts.find((x) => x.id === p.regionId)!;
      const k = districtKeywords(d.name, p.related.map((id) => slugOf.get(id)).filter((x): x is string => !!x));
      console.log(`ilçe ${d.slug}: ${k.focusKeyword} | ${k.secondaryKeywords.join(", ")}`);
      if (APPLY) await db.update(schema.regionPages).set({ ...k }).where(eq(schema.regionPages.id, p.id));
    }
    console.log(APPLY ? "✓ yazıldı" : "Kuru çalıştırma — yazmak için --apply");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
