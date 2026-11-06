import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { RetryButton } from "@/components/admin/RetryButton";
import { AdminPage, EmptyRow, Table, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const metadata = { title: "Bildirimler" };

const TEMPLATE: Record<string, string> = {
  quote_admin: "Teklif → ekip",
  quote_receipt: "Teklif → müşteri (alındı)",
  lead_contact: "İletişim → ekip",
  lead_seo_audit: "SEO analizi → ekip",
  password_reset: "Parola sıfırlama",
  user_invite: "Kullanıcı daveti",
  smtp_test: "SMTP testi",
};
const STATUS: Record<string, string> = { sent: "Gönderildi", failed: "Başarısız", skipped: "Atlandı", pending: "Bekliyor" };

export default async function NotificationsAdmin({ searchParams }: { searchParams: Promise<{ durum?: string }> }) {
  const user = await requireUser("crm");
  const { durum } = await searchParams;
  const where = durum && STATUS[durum] ? eq(notifications.status, durum as "sent") : undefined;
  const [rows, counts] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(200),
    db.select({ s: notifications.status, n: sql<number>`count(*)::int` }).from(notifications).groupBy(notifications.status),
  ]);
  const c = Object.fromEntries(counts.map((x) => [x.s, x.n]));
  return (
    <AdminPage title="E-posta bildirimleri" description="Gönderilen her e-postanın durumu. Gönderim başarısız olsa da teklif ve başvuru kayıtları korunur; buradan yeniden gönderebilirsiniz.">
      <div className="mb-4 flex flex-wrap gap-2">
        {["", "sent", "failed", "skipped"].map((s) => (
          <Link key={s || "all"} href={s ? `?durum=${s}` : "?"} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", (durum ?? "") === s ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
            {s ? `${STATUS[s]} (${c[s] ?? 0})` : "Tümü"}
          </Link>
        ))}
      </div>
      <Table head={["Zaman", "Tür", "Alıcı", "Durum", "Ayrıntı", ""]}>
        {rows.length === 0 ? <EmptyRow cols={6} text="Bildirim yok." /> : null}
        {rows.map((n) => (
          <tr key={n.id} className="align-top">
            <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-soft">{fmtDateTime(n.createdAt)}</td>
            <td className="px-4 py-3 text-sm">
              {n.relatedType === "quote" && n.relatedId ? (
                <Link href={`/admin/teklifler/${n.relatedId}/`} className="hover:text-brand">
                  {TEMPLATE[n.template] ?? n.template}
                </Link>
              ) : n.relatedType === "lead" && n.relatedId ? (
                <Link href={`/admin/basvurular/${n.relatedId}/`} className="hover:text-brand">
                  {TEMPLATE[n.template] ?? n.template}
                </Link>
              ) : (
                (TEMPLATE[n.template] ?? n.template)
              )}
            </td>
            <td className="px-4 py-3 text-sm break-all">{n.recipient}</td>
            <td className={cn("px-4 py-3 text-sm font-medium", n.status === "sent" ? "text-success" : n.status === "failed" ? "text-danger" : "text-ink-soft")}>{STATUS[n.status]}</td>
            <td className="max-w-xs px-4 py-3 text-xs text-ink-muted">{n.lastError ?? ""}</td>
            <td className="px-4 py-3">{n.status !== "sent" && (n.relatedType === "quote" || n.relatedType === "lead") ? <RetryButton csrf={user.csrfToken} id={n.id} /> : null}</td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
