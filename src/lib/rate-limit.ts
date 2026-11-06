import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * Sabit pencereli sayaç; PM2 cluster'daki tüm süreçler aynı tabloyu kullanır.
 * Tek SQL komutu (upsert) — yarış koşulu yok.
 * @returns izin verildiyse true
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const res = await db.execute<{ count: number }>(sql`
    insert into rate_limits (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSec}))
    on conflict (key) do update set
      count = case when rate_limits.reset_at < now() then 1 else rate_limits.count + 1 end,
      reset_at = case when rate_limits.reset_at < now() then now() + make_interval(secs => ${windowSec}) else rate_limits.reset_at end
    returning count
  `);
  const count = Number(res.rows[0]?.count ?? 0);
  // Süresi dolmuş anahtarları ara sıra temizle
  if (Math.random() < 0.02) await db.execute(sql`delete from rate_limits where reset_at < now() - interval '1 day'`);
  return count <= limit;
}
