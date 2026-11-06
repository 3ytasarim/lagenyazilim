import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { AdminPage, EmptyRow, Table, fmtDateTime } from "@/components/admin/ui";
import { auditLabel } from "@/lib/audit-labels";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const metadata = { title: "İşlem kaydı" };
const PER = 50;
const TYPES = ["", "auth", "service", "post", "project", "page", "media", "setting", "user"];
const TYPE_LABEL: Record<string, string> = { "": "Tümü", auth: "Giriş", service: "Hizmet", post: "Blog", project: "Proje", page: "Sayfa", media: "Medya", setting: "Ayar", user: "Kullanıcı" };

export default async function AuditAdmin({ searchParams }: { searchParams: Promise<{ tur?: string; sayfa?: string }> }) {
  await requireUser("audit");
  const sp = await searchParams;
  const type = TYPES.includes(sp.tur ?? "") ? (sp.tur ?? "") : "";
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const where = type === "auth" ? sql`${auditLogs.action} like 'auth.%'` : type ? eq(auditLogs.entityType, type) : undefined;
  const [rows, [count]] = await Promise.all([
    db
      .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, diff: auditLogs.diff, createdAt: auditLogs.createdAt, actor: users.name })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PER)
      .offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).where(where),
  ]);
  const total = count?.n ?? 0;
  return (
    <AdminPage title="İşlem kaydı" description="Kritik yönetim işlemleri. Kişisel veriler (e-posta, telefon, parola) kayıtlarda maskelenir; IP adresi yerine geri döndürülemez özet tutulur.">
      <div className="mb-4 flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Link key={t || "all"} href={t ? `?tur=${t}` : "?"} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", type === t ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
            {TYPE_LABEL[t]}
          </Link>
        ))}
      </div>
      <Table head={["Zaman", "Kullanıcı", "İşlem", "Ayrıntı"]}>
        {rows.length === 0 ? <EmptyRow cols={4} text="Kayıt yok." /> : null}
        {rows.map((r) => (
          <tr key={r.id} className="align-top">
            <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-soft">{fmtDateTime(r.createdAt)}</td>
            <td className="px-4 py-3 text-sm">{r.actor ?? "—"}</td>
            <td className="px-4 py-3 text-sm">{auditLabel(r.action)}</td>
            <td className="max-w-md px-4 py-3">
              {r.diff ? (
                <details>
                  <summary className="cursor-pointer text-sm text-brand">Değişiklikler</summary>
                  <pre className="mt-2 max-h-60 overflow-auto rounded bg-surface-2 p-2 text-xs whitespace-pre-wrap">{JSON.stringify(r.diff, null, 2)}</pre>
                </details>
              ) : (
                <span className="text-sm text-ink-soft">—</span>
              )}
            </td>
          </tr>
        ))}
      </Table>
      {total > PER ? (
        <p className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={`?${new URLSearchParams({ ...(type ? { tur: type } : {}), sayfa: String(page - 1) })}`}>← Önceki</Link> : null}
          <span className="text-ink-soft">
            Sayfa {page} / {Math.ceil(total / PER)}
          </span>
          {page * PER < total ? <Link href={`?${new URLSearchParams({ ...(type ? { tur: type } : {}), sayfa: String(page + 1) })}`}>Sonraki →</Link> : null}
        </p>
      ) : null}
    </AdminPage>
  );
}
