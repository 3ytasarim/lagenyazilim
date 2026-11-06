import "dotenv/config";
import { Pool } from "pg";

/** Salt okunur: tablo listesi ve satır sayıları. */
const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
const t = await pool.query("select table_name from information_schema.tables where table_schema='public' order by 1");
const rows: string[] = [];
for (const { table_name } of t.rows as { table_name: string }[]) {
  const c = await pool.query(`select count(*)::int as n from "${table_name}"`);
  rows.push(`${table_name}=${c.rows[0].n}`);
}
console.log(`${t.rows.length} tablo: ${rows.join(", ")}`);
await pool.end();
