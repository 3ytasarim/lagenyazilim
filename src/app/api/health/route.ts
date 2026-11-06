import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Sağlık kontrolü — deploy betiği ve izleme (uptime) için. Veritabanına basit bir sorgu atar.
 * Hassas bilgi döndürmez; yalnızca durum ve sürüm.
 */
export async function GET() {
  const started = Date.now();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, db: "ok", ms: Date.now() - started, release: process.env.RELEASE_ID ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
