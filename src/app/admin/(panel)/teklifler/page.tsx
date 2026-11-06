import Link from "next/link";
import { asc } from "drizzle-orm";
import { Download } from "lucide-react";
import { AdminPage, EmptyRow, Table, fmtDateTime } from "@/components/admin/ui";
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL } from "@/lib/crm";
import { db } from "@/lib/db";
import { quoteServiceOptions } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { listQuotes, type QuoteFilters } from "@/server/queries/crm";

export const metadata = { title: "Teklifler" };

export default async function QuotesAdmin({ searchParams }: { searchParams: Promise<QuoteFilters> }) {
  const user = await requireUser("crm");
  const f = await searchParams;
  const [{ rows, total, page, per, statusCounts }, options] = await Promise.all([listQuotes(f, user.id), db.select({ key: quoteServiceOptions.key, label: quoteServiceOptions.label }).from(quoteServiceOptions).orderBy(asc(quoteServiceOptions.sortOrder))]);
  const labelOf = new Map(options.map((o) => [o.key, o.label]));
  const qs = (patch: Partial<QuoteFilters>) => {
    const p = new URLSearchParams(Object.entries({ ...f, ...patch, sayfa: patch.sayfa ?? undefined }).filter(([, v]) => v) as [string, string][]);
    const s = p.toString();
    return s ? `?${s}` : "?";
  };
  const csvHref = `/admin/teklifler/csv/${qs({}).replace(/^\?$/, "")}`;

  return (
    <AdminPage
      title="Teklif talepleri"
      description="Web sitesindeki proje teklifi formundan gelen talepler. Arşivlenenler varsayılan listede gösterilmez."
      actions={
        <a href={csvHref} className={buttonClass("secondary", "sm")}>
          <Download aria-hidden className="size-4" /> CSV indir
        </a>
      }
    >
      <nav aria-label="Durum" className="mb-4 flex flex-wrap gap-2">
        <Link href={qs({ durum: undefined })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", !f.durum ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
          Açık
        </Link>
        {QUOTE_STATUSES.map((s) => (
          <Link key={s} href={qs({ durum: s })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", f.durum === s ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
            {QUOTE_STATUS_LABEL[s]} <span className="tabular-nums opacity-60">{statusCounts[s] ?? 0}</span>
          </Link>
        ))}
        <Link href={qs({ durum: "tumu" })} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", f.durum === "tumu" ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
          Tümü
        </Link>
      </nav>

      <form className="mb-5 grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6" action="/admin/teklifler/">
        {f.durum ? <input type="hidden" name="durum" value={f.durum} /> : null}
        <input name="q" defaultValue={f.q} placeholder="No, ad, e-posta, firma" aria-label="Ara" className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm lg:col-span-2" />
        <select name="hizmet" defaultValue={f.hizmet ?? ""} aria-label="Hizmet" className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm">
          <option value="">Tüm hizmetler</option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <select name="sorumlu" defaultValue={f.sorumlu ?? ""} aria-label="Sorumlu" className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm">
          <option value="">Tüm sorumlular</option>
          <option value="ben">Bana atananlar</option>
          <option value="atanmamis">Atanmamış</option>
        </select>
        <input type="date" name="baslangic" defaultValue={f.baslangic} aria-label="Başlangıç tarihi" className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm" />
        <div className="flex gap-2">
          <input type="date" name="bitis" defaultValue={f.bitis} aria-label="Bitiş tarihi" className="h-10 min-w-0 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm" />
          <button type="submit" className="h-10 rounded-md bg-ink px-4 text-sm font-semibold text-bg">
            Filtrele
          </button>
        </div>
      </form>

      <Table head={["Numara", "Kişi / firma", "Hizmetler", "Bütçe", "Sorumlu", "Durum", "Tarih"]}>
        {rows.length === 0 ? <EmptyRow cols={7} text="Bu filtreye uyan teklif yok." /> : null}
        {rows.map((q) => (
          <tr key={q.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3 whitespace-nowrap">
              <Link href={`/admin/teklifler/${q.id}/`} className="font-semibold tabular-nums hover:text-brand">
                {q.number}
              </Link>
            </td>
            <td className="px-4 py-3">
              <span className="block font-medium">{q.contactName}</span>
              {q.company ? <span className="block text-sm text-ink-soft">{q.company}</span> : null}
            </td>
            <td className="px-4 py-3 text-sm">{q.serviceKeys.map((k) => labelOf.get(k) ?? k).join(", ")}</td>
            <td className="px-4 py-3 text-sm">{q.budgetLabel ?? "—"}</td>
            <td className="px-4 py-3 text-sm">{q.assignee ?? <span className="text-ink-soft">Atanmamış</span>}</td>
            <td className="px-4 py-3">
              <QuoteStatusBadge status={q.status} />
            </td>
            <td className="px-4 py-3 text-sm whitespace-nowrap text-ink-soft">{fmtDateTime(q.createdAt)}</td>
          </tr>
        ))}
      </Table>
      {total > per ? (
        <p className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={qs({ sayfa: String(page - 1) })}>← Önceki</Link> : null}
          <span className="text-ink-soft">
            {total} kayıt · sayfa {page} / {Math.ceil(total / per)}
          </span>
          {page * per < total ? <Link href={qs({ sayfa: String(page + 1) })}>Sonraki →</Link> : null}
        </p>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">{total} kayıt</p>
      )}
    </AdminPage>
  );
}
