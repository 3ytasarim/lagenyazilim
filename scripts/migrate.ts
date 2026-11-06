import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

/**
 * drizzle/ klasöründeki sürümlü migration'ları uygular.
 * - Doğrudan (pooler olmayan) bağlantı kullanılır.
 * - Henüz uygulanmamış bir migration veri kaybettirebilecek komut içeriyorsa ALLOW_DESTRUCTIVE=1 olmadan durur.
 */
const DESTRUCTIVE = /\b(DROP\s+(TABLE|COLUMN|TYPE|SCHEMA)|TRUNCATE|ALTER\s+COLUMN\s+\S+\s+(SET\s+DATA\s+)?TYPE|DELETE\s+FROM)\b/i;

async function appliedHashes(pool: Pool): Promise<Set<string>> {
  const t = await pool.query("select to_regclass('drizzle.__drizzle_migrations') as t");
  if (!t.rows[0]?.t) return new Set();
  const r = await pool.query<{ hash: string }>("select hash from drizzle.__drizzle_migrations");
  return new Set(r.rows.map((x) => x.hash));
}

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_DIRECT / DATABASE_URL tanımlı değil.");
  if (url.includes("-pooler")) console.warn("⚠ Pooler bağlantısı kullanılıyor; migration için DATABASE_URL_DIRECT önerilir.");

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    const applied = await appliedHashes(pool);
    const journal = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
    for (const { tag } of journal.entries) {
      const sql = readFileSync(`drizzle/${tag}.sql`, "utf8");
      const pending = !applied.has(createHash("sha256").update(sql).digest("hex"));
      if (pending && DESTRUCTIVE.test(sql) && process.env.ALLOW_DESTRUCTIVE !== "1") {
        throw new Error(`${tag}.sql veri kaybettirebilecek komut içeriyor. Gözden geçirip ALLOW_DESTRUCTIVE=1 ile çalıştırın.`);
      }
    }
    await migrate(drizzle(pool, { casing: "snake_case" }), { migrationsFolder: "./drizzle" });
    console.log("✓ Migration'lar uygulandı.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
