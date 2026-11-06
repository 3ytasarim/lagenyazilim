import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageForm, type PageFormData } from "@/components/admin/forms/PageForm";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { RESERVED_PAGE_SLUGS } from "@/lib/content/reserved";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { linkTargets, mediaRef, publishValues, revisionItems, seoValues } from "@/server/queries/admin";

export const metadata = { title: "Sayfa düzenle" };

/** Gövdesi kodda tasarlanmış sayfalar. */
const TEMPLATE_PAGES = ["hakkimizda"];

export default async function PageEdit({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("content");
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const row = isNew ? undefined : (await db.select().from(pages).where(eq(pages.id, id)).limit(1))[0];
  if (!isNew && !row) notFound();
  const [og, targets, revisions] = await Promise.all([mediaRef(row?.ogImageId), linkTargets(), row ? revisionItems("page", row.id) : Promise.resolve([])]);

  const data: PageFormData = {
    id: row?.id ?? null,
    title: row?.title ?? "",
    h1: row?.h1 ?? "",
    excerpt: row?.excerpt ?? "",
    kind: row?.kind ?? "corporate",
    requiresLegalReview: row?.requiresLegalReview ?? false,
    version: row?.version ?? "",
    body: row?.body ?? null,
    bodyHtml: row?.bodyHtml ?? "",
    hasBody: !row || !TEMPLATE_PAGES.includes(row.slug),
    slugLocked: !!row && RESERVED_PAGE_SLUGS.includes(row.slug),
    ogImage: og,
    seo: seoValues(row),
    publish: publishValues(row),
  };
  return (
    <AdminPage title={isNew ? "Yeni sayfa" : row!.title} crumbs={[{ href: "/admin/sayfalar/", label: "Sayfalar" }]}>
      <PageForm data={data} csrf={user.csrfToken} siteUrl={SITE_URL} linkTargets={targets} revisions={revisions} />
    </AdminPage>
  );
}
