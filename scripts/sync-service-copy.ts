import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { SERVICES } from "../src/content/services";
import * as schema from "../src/lib/db/schema";

/*
 * Hizmet metinlerini seed kaynağından (src/content/services.ts) veritabanına eşitler:
 * h1, özet, giriş metni, kısa cevap, kapsam, SSS. Admin panelinde yapılmış metin düzenlemelerinin ÜZERİNE YAZAR —
 * yalnızca seed metni bilerek güncellendiğinde (ör. 2026-11 Türkiye geneli konumlandırma) çalıştırın.
 * Varsayılan kuru çalıştırma (farkları listeler); yazmak için --apply.
 */
const APPLY = process.argv.includes("--apply");
const FIELDS = ["h1", "summary", "heroText", "shortAnswer", "scope", "faqs"] as const;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    for (const seed of SERVICES) {
      const [row] = await db.select().from(schema.services).where(eq(schema.services.slug, seed.slug)).limit(1);
      if (!row) continue;
      const changed = FIELDS.filter((f) => JSON.stringify(row[f]) !== JSON.stringify(seed[f]));
      console.log(`${seed.slug}: ${changed.length ? changed.join(", ") : "aynı"}`);
      if (APPLY && changed.length) {
        await db
          .update(schema.services)
          .set({ ...Object.fromEntries(changed.map((f) => [f, seed[f]])), updatedAt: new Date() })
          .where(eq(schema.services.id, row.id));
      }
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
