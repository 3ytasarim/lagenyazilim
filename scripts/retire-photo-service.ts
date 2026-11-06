import "dotenv/config";
import { and, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SERVICES } from "../src/content/services";
import * as schema from "../src/lib/db/schema";

/*
 * Fotoğraf ve drone çekimi hizmeti artık verilmiyor (2026-11 müşteri kararı).
 * - Hizmet kaydı silinmez, "archived" yapılır (geçmiş teklif/revizyon kayıtları korunur); adres proxy'de 410.
 * - Teklif sihirbazındaki seçenek pasifleştirilir.
 * - Bu hizmete verilen "ilgili hizmet" bağlantıları kaldırılır; seed'de metni değişen hizmetler güncellenir.
 * Varsayılan kuru çalıştırmadır; yazmak için --apply.
 */
const SLUG = "ankara-fotograf-cekimi";
const QUOTE_KEY = "fotograf-drone";
const APPLY = process.argv.includes("--apply");
const UPDATED = ["ankara-sosyal-medya-yonetimi", "ankara-katalog-tasarimi", "ankara-web-tasarim"];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const [svc] = await db.select({ id: schema.services.id, status: schema.services.status }).from(schema.services).where(eq(schema.services.slug, SLUG));
    const rels = svc
      ? await db
          .select()
          .from(schema.serviceRelations)
          .where(or(eq(schema.serviceRelations.serviceId, svc.id), eq(schema.serviceRelations.relatedId, svc.id)))
      : [];
    const combos = svc ? await db.select({ id: schema.regionPages.id }).from(schema.regionPages).where(eq(schema.regionPages.serviceId, svc.id)) : [];
    console.log(`hizmet: ${svc ? svc.status : "yok"} · ilişki: ${rels.length} · hizmet+bölge sayfası: ${combos.length}`);
    if (!APPLY) {
      console.log("Kuru çalıştırma — yazmak için --apply");
      return;
    }
    await db.transaction(async (tx) => {
      if (svc) {
        await tx.update(schema.services).set({ status: "archived", robotsIndex: false, updatedAt: new Date() }).where(eq(schema.services.id, svc.id));
        await tx.delete(schema.serviceRelations).where(or(eq(schema.serviceRelations.serviceId, svc.id), eq(schema.serviceRelations.relatedId, svc.id)));
        if (combos.length) await tx.update(schema.regionPages).set({ status: "archived", updatedAt: new Date() }).where(eq(schema.regionPages.serviceId, svc.id));
      }
      await tx.update(schema.quoteServiceOptions).set({ isActive: false, updatedAt: new Date() }).where(eq(schema.quoteServiceOptions.key, QUOTE_KEY));

      // Metni değişen hizmetler (seed kaynağı = src/content/services.ts)
      const rows = await tx.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
      const idOf = new Map(rows.map((r) => [r.slug, r.id]));
      for (const s of SERVICES.filter((x) => UPDATED.includes(x.slug))) {
        const id = idOf.get(s.slug);
        if (!id) continue;
        await tx.update(schema.services).set({ shortAnswer: s.shortAnswer, scope: s.scope, faqs: s.faqs, updatedAt: new Date() }).where(eq(schema.services.id, id));
        // İlgili hizmetler seed ile aynı sıraya getirilir
        await tx.delete(schema.serviceRelations).where(eq(schema.serviceRelations.serviceId, id));
        const rel = s.related.map((r, i) => ({ serviceId: id, relatedId: idOf.get(r)!, sortOrder: i })).filter((r) => r.relatedId);
        if (rel.length) await tx.insert(schema.serviceRelations).values(rel);
      }
      // Diğer hizmetlerin ilgili listesinde bu hizmet kaldıysa (yukarıda silindi) boşluk kalmasın
      const left = await tx
        .select({ serviceId: schema.serviceRelations.serviceId })
        .from(schema.serviceRelations)
        .where(and(inArray(schema.serviceRelations.serviceId, [...idOf.values()])));
      console.log(`kalan ilişki satırı: ${left.length}`);
    });
    console.log("✓ Fotoğraf/drone hizmeti arşivlendi, teklif seçeneği kapatıldı, ilgili hizmetler güncellendi.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
