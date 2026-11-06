import { notFound } from "next/navigation";
import { asc, eq, ne } from "drizzle-orm";
import { ServiceForm, type ServiceFormData } from "@/components/admin/forms/ServiceForm";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { quoteServiceOptions, serviceRelations, services } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { linkTargets, publishValues, revisionItems, seoValues } from "@/server/queries/admin";

export const metadata = { title: "Hizmet düzenle" };

/** /admin/hizmetler/yeni/ ve /admin/hizmetler/<id>/ aynı formu kullanır. */
export default async function ServiceEdit({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("content");
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(id)) notFound();

  const row = isNew ? undefined : (await db.select().from(services).where(eq(services.id, id)).limit(1))[0];
  if (!isNew && !row) notFound();

  const [others, rel, options, targets, revisions] = await Promise.all([
    db.select({ id: services.id, name: services.name }).from(services).where(row ? ne(services.id, row.id) : undefined).orderBy(asc(services.sortOrder)),
    row ? db.select({ id: serviceRelations.relatedId }).from(serviceRelations).where(eq(serviceRelations.serviceId, row.id)).orderBy(asc(serviceRelations.sortOrder)) : Promise.resolve([]),
    db.select({ value: quoteServiceOptions.key, label: quoteServiceOptions.label }).from(quoteServiceOptions).orderBy(asc(quoteServiceOptions.sortOrder)),
    linkTargets(),
    row ? revisionItems("service", row.id) : Promise.resolve([]),
  ]);

  const data: ServiceFormData = {
    id: row?.id ?? null,
    name: row?.name ?? "",
    shortName: row?.shortName ?? "",
    h1: row?.h1 ?? "",
    summary: row?.summary ?? "",
    heroText: row?.heroText ?? "",
    shortAnswer: row?.shortAnswer ?? "",
    icon: row?.icon ?? "layout",
    problem: row?.problem ?? "",
    approach: row?.approach ?? "",
    scope: row?.scope ?? [],
    deliverables: row?.deliverables ?? [],
    sectors: row?.sectors ?? [],
    process: row?.process ?? [],
    faqs: row?.faqs ?? [],
    quoteKey: row?.quoteKey ?? null,
    isCore: row?.isCore ?? false,
    sortOrder: row?.sortOrder ?? 99,
    body: row?.body ?? null,
    bodyHtml: row?.bodyHtml ?? "",
    related: rel.map((r) => r.id),
    seo: seoValues(row),
    publish: publishValues(row),
  };

  return (
    <AdminPage title={isNew ? "Yeni hizmet" : row!.name} crumbs={[{ href: "/admin/hizmetler/", label: "Hizmetler" }]} description={isNew ? "Yeni hizmetler varsayılan olarak 'öneri' ve taslak olarak oluşturulur." : undefined}>
      <ServiceForm data={data} csrf={user.csrfToken} siteUrl={SITE_URL} otherServices={others} quoteOptions={options} linkTargets={targets} revisions={revisions} />
    </AdminPage>
  );
}
