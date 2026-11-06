import Link from "next/link";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { Plus } from "lucide-react";
import { AdminPage, EmptyRow, StatusBadge, Table, fmtDateTime } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { authors, blogCategories, blogPosts } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const metadata = { title: "Blog yazıları" };

const FILTERS = [
  { key: "", label: "Tümü" },
  { key: "draft", label: "Taslak" },
  { key: "review", label: "İncelemede" },
  { key: "published", label: "Yayında" },
  { key: "archived", label: "Arşiv" },
];
const PER = 30;

export default async function PostsAdmin({ searchParams }: { searchParams: Promise<{ durum?: string; q?: string; sayfa?: string }> }) {
  await requireUser("content");
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.key === sp.durum) ? sp.durum : "";
  const page = Math.max(1, Number(sp.sayfa) || 1);
  const where = and(
    status === "draft" ? inArray(blogPosts.status, ["draft"]) : status ? eq(blogPosts.status, status as "review") : undefined,
    sp.q ? ilike(blogPosts.title, `%${sp.q.slice(0, 80)}%`) : undefined,
  );
  const [rows, [count]] = await Promise.all([
    db
      .select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, status: blogPosts.status, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt, seoDescription: blogPosts.seoDescription, category: blogCategories.name, author: authors.name })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(authors, eq(blogPosts.authorId, authors.id))
      .where(where)
      .orderBy(desc(blogPosts.updatedAt))
      .limit(PER)
      .offset((page - 1) * PER),
    db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).where(where),
  ]);
  const total = count?.n ?? 0;

  return (
    <AdminPage
      title="Blog yazıları"
      description="Taslaklar sitede görünmez. Kaynak gerektiren iddialar [KAYNAK] ile işaretlenirse yazı yayımlanamaz."
      actions={
        <Link href="/admin/blog/yeni/" className={buttonClass("primary", "sm")}>
          <Plus aria-hidden className="size-4" /> Yeni yazı
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key ? `/admin/blog/?durum=${f.key}` : "/admin/blog/"} className={cn("rounded-full border px-3.5 py-1.5 text-sm font-medium", status === f.key ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink")}>
            {f.label}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/blog/">
          {status ? <input type="hidden" name="durum" value={status} /> : null}
          <input name="q" defaultValue={sp.q} placeholder="Başlıkta ara" aria-label="Başlıkta ara" className="h-10 rounded-full border border-line-strong bg-surface px-4 text-sm outline-none focus:border-brand" />
        </form>
      </div>
      <Table head={["Başlık", "Kategori", "Yazar", "Durum", "Güncelleme"]}>
        {rows.length === 0 ? <EmptyRow cols={5} text="Yazı bulunamadı." /> : null}
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-surface-2/40">
            <td className="px-4 py-3">
              <Link href={`/admin/blog/${p.id}/`} className="font-semibold hover:text-brand">
                {p.title}
              </Link>
              <span className="block text-xs text-ink-soft">/blog/{p.slug}/</span>
            </td>
            <td className="px-4 py-3 text-sm">{p.category ?? "—"}</td>
            <td className="px-4 py-3 text-sm">{p.author ?? "—"}</td>
            <td className="px-4 py-3">
              <StatusBadge status={p.status} publishedAt={p.publishedAt} />
            </td>
            <td className="px-4 py-3 text-sm text-ink-soft">{fmtDateTime(p.updatedAt)}</td>
          </tr>
        ))}
      </Table>
      {total > PER ? (
        <p className="mt-4 flex gap-4 text-sm">
          {page > 1 ? <Link href={`?${new URLSearchParams({ ...(status ? { durum: status } : {}), sayfa: String(page - 1) })}`}>← Önceki</Link> : null}
          <span className="text-ink-soft">
            Sayfa {page} / {Math.ceil(total / PER)}
          </span>
          {page * PER < total ? <Link href={`?${new URLSearchParams({ ...(status ? { durum: status } : {}), sayfa: String(page + 1) })}`}>Sonraki →</Link> : null}
        </p>
      ) : null}
    </AdminPage>
  );
}
