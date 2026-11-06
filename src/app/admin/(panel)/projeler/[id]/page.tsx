import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ProjectForm, type ProjectFormData } from "@/components/admin/forms/ProjectForm";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projectServices, projects, services } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { linkTargets, mediaRef, mediaRefs, publishValues, revisionItems, seoValues } from "@/server/queries/admin";

export const metadata = { title: "Proje düzenle" };

export default async function ProjectEdit({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("content");
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const row = isNew ? undefined : (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0];
  if (!isNew && !row) notFound();

  const [svc, picked, cover, gallery, targets, revisions] = await Promise.all([
    db.select({ id: services.id, name: services.name }).from(services).orderBy(asc(services.sortOrder)),
    row ? db.select({ id: projectServices.serviceId }).from(projectServices).where(eq(projectServices.projectId, row.id)) : Promise.resolve([]),
    mediaRef(row?.coverImageId),
    mediaRefs(row?.gallery ?? []),
    linkTargets(),
    row ? revisionItems("project", row.id) : Promise.resolve([]),
  ]);

  const data: ProjectFormData = {
    id: row?.id ?? null,
    title: row?.title ?? "",
    clientName: row?.clientName ?? "",
    sector: row?.sector ?? "",
    summary: row?.summary ?? "",
    challenge: row?.challenge ?? "",
    solution: row?.solution ?? "",
    results: row?.results ?? "",
    body: row?.body ?? null,
    bodyHtml: row?.bodyHtml ?? "",
    cover,
    gallery,
    liveUrl: row?.liveUrl ?? "",
    year: row?.year ? String(row.year) : "",
    clientConsent: row?.clientConsent ?? false,
    isFeatured: row?.isFeatured ?? false,
    sortOrder: row?.sortOrder ?? 0,
    services: picked.map((p) => p.id),
    seo: seoValues(row),
    publish: publishValues(row),
  };

  return (
    <AdminPage title={isNew ? "Yeni proje" : row!.title} crumbs={[{ href: "/admin/projeler/", label: "Projeler" }]}>
      <ProjectForm data={data} csrf={user.csrfToken} siteUrl={SITE_URL} services={svc} linkTargets={targets} revisions={revisions} />
    </AdminPage>
  );
}
