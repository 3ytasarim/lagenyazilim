import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { AdminPage, EmptyRow, StatusBadge, Table, fmtDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";

export const metadata = { title: "Sayfalar" };

export default async function PagesAdmin() {
  await requireUser("content");
  const rows = await db.select().from(pages).orderBy(asc(pages.kind), asc(pages.title));
  return (
    <AdminPage
      title="Sayfalar"
      description="Kurumsal ve yasal sayfalar. Hukuki onayı tamamlanmamış yasal metinler sitede uyarı bandıyla görünür ve indekslenmez."
      actions={
        <Link href="/admin/sayfalar/yeni/" className={buttonClass("primary", "sm")}>
          <Plus aria-hidden className="size-4" /> Yeni sayfa
        </Link>
      }
    >
      <Table head={["Sayfa", "Adres", "Tür", "Durum", "Güncelleme"]}>
        {rows.length === 0 ? <EmptyRow cols={5} text="Sayfa yok." /> : null}
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3">
              <Link href={`/admin/sayfalar/${p.id}/`} className="font-semibold hover:text-brand">
                {p.title}
              </Link>
              {p.requiresLegalReview ? <span className="ml-2 text-xs text-warning">Hukuki onay bekliyor</span> : null}
            </td>
            <td className="px-4 py-3 text-sm text-ink-muted">/{p.slug}/</td>
            <td className="px-4 py-3 text-sm">{p.kind === "legal" ? "Yasal" : "Kurumsal"}</td>
            <td className="px-4 py-3">
              <StatusBadge status={p.status} publishedAt={p.publishedAt} />
            </td>
            <td className="px-4 py-3 text-sm text-ink-soft">{fmtDateTime(p.updatedAt)}</td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
