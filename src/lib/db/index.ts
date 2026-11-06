import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Tek bağlantı havuzu; dev'de HMR sırasında yeniden oluşmasın diye globalThis'te tutulur.
 * Bağlantı bilgisi yalnızca DATABASE_URL ortam değişkeninden gelir.
 */
type Db = NodePgDatabase<typeof schema>;
const g = globalThis as unknown as { __lagenPool?: Pool; __lagenDb?: Db };

function createDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");
  const pool = g.__lagenPool ?? new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 15_000 });
  g.__lagenPool = pool;
  return drizzle(pool, { schema, casing: "snake_case" });
}

export const db: Db = g.__lagenDb ?? (g.__lagenDb = createDb());
export { schema };
