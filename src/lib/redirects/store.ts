import { Pool } from "pg";

/**
 * Admin'de yönetilen yönlendirme kuralları — proxy içinden okunur.
 * Proxy her istekte çalıştığı için kurallar süreç belleğinde 60 sn tutulur (çoklu PM2 sürecinde de en geç 60 sn'de yayılır).
 * Proxy paketine Drizzle/"server-only" taşımamak için doğrudan küçük bir pg havuzu kullanılır.
 */

type Rule = { to: string; status: number };
const TTL_MS = 60_000;
const g = globalThis as unknown as { __lagenRedirectPool?: Pool; __lagenRedirects?: { at: number; map: Map<string, Rule> } };

function pool() {
  g.__lagenRedirectPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5000 });
  return g.__lagenRedirectPool;
}

async function load(): Promise<Map<string, Rule>> {
  const cached = g.__lagenRedirects;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.map;
  try {
    const r = await pool().query<{ from_path: string; to_path: string; status_code: number }>("select from_path, to_path, status_code from redirect_rules where is_active");
    const map = new Map(r.rows.map((x) => [x.from_path, { to: x.to_path, status: x.status_code }]));
    g.__lagenRedirects = { at: Date.now(), map };
    return map;
  } catch (e) {
    // Veritabanına ulaşılamazsa site çalışmaya devam eder; son bilinen kurallar kullanılır
    console.error("[redirects] okunamadı", e instanceof Error ? e.message : e);
    return cached?.map ?? new Map();
  }
}

export async function findRedirect(path: string): Promise<Rule | null> {
  return (await load()).get(path) ?? null;
}

export function countHit(path: string) {
  pool()
    .query("update redirect_rules set hits = hits + 1, last_hit_at = now() where from_path = $1", [path])
    .catch(() => {});
}
