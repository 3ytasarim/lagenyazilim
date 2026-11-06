import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

/**
 * İlk süper yöneticiyi oluşturur.
 *   npm run admin:create -- eposta@firma.com "Ad Soyad"
 * Parola terminalde sorulur (ekrana yazılmaz, komut geçmişine düşmez).
 * Yalnızca otomasyon için: ADMIN_PASSWORD ortam değişkeni.
 */
async function askHidden(q: string): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => (s.startsWith(q) ? write.call(rl, s) : write.call(rl, "*"));
  const v = await rl.question(q);
  rl.close();
  stdout.write("\n");
  return v;
}

async function main() {
  const [email, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(" ").trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    console.error('Kullanım: npm run admin:create -- eposta@firma.com "Ad Soyad"');
    process.exit(1);
  }
  const password = await askHidden("Parola (en az 12 karakter, harf + rakam): ");
  if (password.length < 12 || !/\d/.test(password) || !/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(password)) {
    console.error("Parola en az 12 karakter olmalı ve harf ile rakam içermeli.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const lower = email.toLowerCase();
    const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, lower)).limit(1);
    if (exists) {
      console.error("Bu e-posta ile kullanıcı zaten var. Parola sıfırlama için giriş ekranındaki bağlantıyı kullanın.");
      process.exit(1);
    }
    await db.insert(schema.users).values({ email: lower, name, role: "super_admin", passwordHash: await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 }) });
    console.log(`✓ Süper yönetici oluşturuldu: ${lower}`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
