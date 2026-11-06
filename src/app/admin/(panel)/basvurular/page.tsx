import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { Download } from "lucide-react";
import { AdminPage, EmptyRow, Table, fmtDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/crm";
import { db } from "@/lib/db";
import { leads, users } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { leadWhere, type LeadFilters } from "@/server/queries/crm";

export const metadata = { title: "Başvurular" };
const PER = 30;

export default async function LeadsAdmin({ searchParams }: { searchParams: Promise<LeadFilters> }) {
  await requireUser("crm");
  const f = await searchParams;
  const page = Math.max(1, Number(f.sayfa) || 1);
  const where = leadWhere(f);
  const [rows, [count]] = await Promise.all([
    db
      .select({ id: leads.id, source: leads.source, name: leads.name, company: leads.company, email: leads.email, website: leads.website, status: leads.status, createdAt: leads.createdAt, assignee: users.name })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToId, users.id))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(PER)
      .offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(leads).where(where),
  ]);
  const total = count?.n ?? 0;
  const qs = (patch: Partial<LeadFilters>) => {
    const p = new URLSearchParams(Object.entries({ ...f, ...patch, sayfa: patch.sayfa }).filter(([, v]) => v) as [string, string][]).toString();
    return p ? `?${p}` : "?";
  };
  const chip = (active: boolean) => cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", active ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink");

  return (
    <AdminPage
      title="Başvurular"
      description="İletişim formu ve ücretsiz SEO analizi talepleri. Spam olarak işaretlenenler varsayılan listede gösterilmez."
      actions={
        <a href={`/admin/basvurular/csv/${qs({}).replace(/^\?$/, "")}`} className={buttonClass("secondary", "sm")}>
          <Download aria-hidden className="size-4" /> CSV indir
        </a>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={qs({ kaynak: undefined })} className={chip(!f.kaynak)}>
          Tüm kaynaklar
        </Link>
        <Link href={qs({ kaynak: "seo_audit" })} className={chip(f.kaynak === "seo_audit")}>
          SEO analizi
        </Link>
        <Link href={qs({ kaynak: "contact" })} className={chip(f.kaynak === "contact")}>
          İletişim
        </Link>
        <span className="mx-2 h-6 w-px bg-line" />
        {(["new", "contacted", "closed", "spam"] as const).map((s) => (
          <Link key={s} href={qs({ durum: f.durum === s ? undefined : s })} className={chip(f.durum === s)}>
            {LEAD_STATUS_LABEL[s]}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/basvurular/">
          {f.kaynak ? <input type="hidden" name="kaynak" value={f.kaynak} /> : null}
          <input name="q" defaultValue={f.q} placeholder="Ad, e-posta, site" aria-label="Ara" className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm outline-none focus:border-brand" />
        </form>
      </div>
      <Table head={["Kişi", "Kaynak", "Web sitesi", "Sorumlu", "Durum", "Tarih"]}>
        {rows.length === 0 ? <EmptyRow cols={6} text="Başvuru yok." /> : null}
        {rows.map((l) => (
          <tr key={l.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3">
              <Link href={`/admin/basvurular/${l.id}/`} className="font-semibold hover:text-brand">
                {l.name}
              </Link>
              <span className="block text-sm text-ink-soft">{l.company || l.email}</span>
            </td>
            <td className="px-4 py-3 text-sm">{LEAD_SOURCE_LABEL[l.source]}</td>
            <td className="px-4 py-3 text-sm break-all">{l.website ?? "—"}</td>
            <td className="px-4 py-3 text-sm">{l.assignee ?? <span className="text-ink-soft">—</span>}</td>
            <td className="px-4 py-3 text-sm">
              <span className={l.status === "new" ? "font-semibold text-brand" : ""}>{LEAD_STATUS_LABEL[l.status]}</span>
            </td>
            <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-soft">{fmtDateTime(l.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <p className="mt-4 flex gap-4 text-sm text-ink-soft">
        {page > 1 ? <Link href={qs({ sayfa: String(page - 1) })}>← Önceki</Link> : null}
        <span>{total} kayıt</span>
        {page * PER < total ? <Link href={qs({ sayfa: String(page + 1) })}>Sonraki →</Link> : null}
      </p>
    </AdminPage>
  );
}
