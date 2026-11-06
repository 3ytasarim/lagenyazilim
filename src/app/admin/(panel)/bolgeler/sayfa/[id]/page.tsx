import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { RegionPageForm, type RegionPageFormData } from "@/components/admin/forms/RegionPageForm";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { regionPages, regions, services } from "@/lib/db/schema";
import { regionPath } from "@/lib/regions";
import { SITE_URL } from "@/lib/site";
import { linkTargets, publishValues, revisionItems, seoValues } from "@/server/queries/admin";

export const metadata = { title: "Bölge sayfası" };

export default async function RegionPageEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bolge?: string; hizmet?: string }> }) {
  const user = await requireUser("seo");
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "yeni";
  const row = isNew ? undefined : /^[0-9a-f-]{36}$/.test(id) ? (await db.select().from(regionPages).where(eq(regionPages.id, id)).limit(1))[0] : undefined;
  if (!isNew && !row) notFound();

  const regionId = row?.regionId ?? sp.bolge ?? "";
  const serviceId = row ? row.serviceId : sp.hizmet || null;
  if (!/^[0-9a-f-]{36}$/.test(regionId)) notFound();
  const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
  if (!region || region.kind === "city") notFound();
  const [parent] = region.parentId ? await db.select().from(regions).where(eq(regions.id, region.parentId)).limit(1) : [];
  const [service] = serviceId ? await db.select().from(services).where(eq(services.id, serviceId)).limit(1) : [];
  if (serviceId && !service) notFound();

  const [svc, targets, revisions] = await Promise.all([
    db.select({ id: services.id, name: services.name }).from(services).where(eq(services.status, "published")).orderBy(asc(services.sortOrder)),
    linkTargets(),
    row ? revisionItems("region_page", row.id) : Promise.resolve([]),
  ]);
  const label = service ? `${region.name} · ${service.name}` : region.name;
  const path = regionPath(region, parent?.kind === "district" ? parent.slug : null, service?.slug ?? null);

  const data: RegionPageFormData = {
    id: row?.id ?? null,
    regionId,
    serviceId,
    regionLabel: label,
    path,
    title: row?.title ?? label,
    h1: row?.h1 ?? "",
    intro: row?.intro ?? "",
    localNeeds: row?.localNeeds ?? "",
    localSectors: row?.localSectors ?? "",
    serviceModel: row?.serviceModel ?? "",
    body: row?.body ?? null,
    bodyHtml: row?.bodyHtml ?? "",
    faqs: row?.faqs ?? [],
    relatedServiceIds: row?.relatedServiceIds ?? (service ? [] : []),
    score: row?.qualityScore ?? 0,
    report: row?.qualityReport ?? [],
    verificationSource: region.verificationSource,
    seo: { ...seoValues(row ? { ...row, slug: region.slug } : undefined), slug: region.slug },
    publish: publishValues(row),
  };

  return (
    <AdminPage title={label} crumbs={[{ href: "/admin/bolgeler/", label: "Bölge sayfaları" }]} description={region.isVerified ? undefined : "Bu bölge kaydı henüz doğrulanmadı; sayfa yayımlanamaz."}>
      <RegionPageForm data={data} csrf={user.csrfToken} siteUrl={SITE_URL} services={svc} linkTargets={targets} revisions={revisions} />
    </AdminPage>
  );
}
