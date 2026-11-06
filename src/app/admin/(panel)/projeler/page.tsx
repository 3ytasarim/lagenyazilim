import Link from "next/link";
import { asc, desc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { AdminPage, EmptyRow, StatusBadge, Table, fmtDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export const metadata = { title: "Projeler" };

export default async function ProjectsAdmin() {
  await requireUser("content");
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.updatedAt));
  return (
    <AdminPage
      title="Projeler ve vaka analizleri"
      description="Müşterinin yazılı yayın izni işaretlenmeyen projeler yayımlanamaz. Proje yokken Projeler sayfası menüde görünmez."
      actions={
        <Link href="/admin/projeler/yeni/" className={buttonClass("primary", "sm")}>
          <Plus aria-hidden className="size-4" /> Yeni proje
        </Link>
      }
    >
      <Table head={["Proje", "Müşteri", "Sektör", "İzin", "Durum", "Güncelleme"]}>
        {rows.length === 0 ? <EmptyRow cols={6} text="Henüz proje yok." /> : null}
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3">
              <Link href={`/admin/projeler/${p.id}/`} className="font-semibold hover:text-brand">
                {p.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-sm">{p.clientName}</td>
            <td className="px-4 py-3 text-sm">{p.sector || "—"}</td>
            <td className="px-4 py-3 text-sm">{p.clientConsent ? "Var" : <span className="text-warning">Yok</span>}</td>
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
