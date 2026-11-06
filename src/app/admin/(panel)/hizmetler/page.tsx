import Link from "next/link";
import { asc } from "drizzle-orm";
import { Plus } from "lucide-react";
import { AdminPage, EmptyRow, StatusBadge, Table, fmtDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";

export const metadata = { title: "Hizmetler" };

export default async function ServicesAdmin() {
  await requireUser("content");
  const rows = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name));
  return (
    <AdminPage
      title="Hizmetler"
      description="Hizmet sayfalarının içeriği, sıralaması ve SEO ayarları. Onaylanmamış yeni hizmet önerileri 'öneri' olarak işaretlenir ve onaysız yayımlanamaz."
      actions={
        <Link href="/admin/hizmetler/yeni/" className={buttonClass("primary", "sm")}>
          <Plus aria-hidden className="size-4" /> Yeni hizmet
        </Link>
      }
    >
      <Table head={["Sıra", "Hizmet", "Adres", "Tür", "Durum", "Güncelleme"]}>
        {rows.length === 0 ? <EmptyRow cols={6} text="Hizmet yok." /> : null}
        {rows.map((s) => (
          <tr key={s.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3 tabular-nums text-ink-soft">{s.sortOrder}</td>
            <td className="px-4 py-3">
              <Link href={`/admin/hizmetler/${s.id}/`} className="font-semibold hover:text-brand">
                {s.name}
              </Link>
              {!s.seoTitle || !s.seoDescription ? <span className="ml-2 text-xs text-warning">SEO eksik</span> : null}
            </td>
            <td className="px-4 py-3 text-sm text-ink-muted">/{s.slug}/</td>
            <td className="px-4 py-3 text-sm">{s.isCore ? "Ana hizmet" : <span className="text-warning">Öneri</span>}</td>
            <td className="px-4 py-3">
              <StatusBadge status={s.status} publishedAt={s.publishedAt} />
            </td>
            <td className="px-4 py-3 text-sm text-ink-soft">{fmtDateTime(s.updatedAt)}</td>
          </tr>
        ))}
      </Table>
    </AdminPage>
  );
}
