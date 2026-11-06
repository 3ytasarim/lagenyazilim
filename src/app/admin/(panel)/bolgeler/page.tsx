import { and, asc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { RegionManager, type RegionRow } from "@/components/admin/forms/RegionManager";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { regionPages, regions, services } from "@/lib/db/schema";

export const metadata = { title: "Bölge sayfaları" };

export default async function RegionsAdmin() {
  const user = await requireUser("seo");
  const parent = alias(regions, "parent");
  const [rows, pagesRows, svc] = await Promise.all([
    db
      .select({ r: regions, parentName: parent.name })
      .from(regions)
      .leftJoin(parent, eq(regions.parentId, parent.id))
      .where(ne(regions.kind, "city"))
      .orderBy(asc(regions.priority), asc(regions.name)),
    db.select({ id: regionPages.id, regionId: regionPages.regionId, serviceId: regionPages.serviceId, status: regionPages.status, publishedAt: regionPages.publishedAt, score: regionPages.qualityScore, serviceName: services.name }).from(regionPages).leftJoin(services, eq(regionPages.serviceId, services.id)),
    db.select({ id: services.id, name: services.name }).from(services).where(and(eq(services.status, "published"))).orderBy(asc(services.sortOrder)),
  ]);
  const data: RegionRow[] = rows
    .map(({ r, parentName }) => {
      const general = pagesRows.find((p) => p.regionId === r.id && !p.serviceId);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        kind: r.kind,
        parentId: r.parentId,
        parentName: r.kind === "district" ? null : parentName,
        isVerified: r.isVerified,
        verificationSource: r.verificationSource,
        priority: r.priority,
        page: general ? { id: general.id, status: general.status, publishedAt: general.publishedAt?.toISOString() ?? null, score: general.score } : null,
        combos: pagesRows.filter((p) => p.regionId === r.id && p.serviceId).map((p) => ({ id: p.id, serviceName: p.serviceName ?? "", status: p.status, score: p.score })),
      };
    })
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name, "tr"));

  return (
    <AdminPage
      title="Bölge sayfaları"
      description="Bölge verisi var diye sayfa oluşmaz. Her sayfa özgün içerik, bölgeye özgü SSS ve doğrulanmış bölge kaydı gerektirir; kalite puanı 100 olmadan yayımlanamaz ve sitemap'e girmez."
    >
      <RegionManager csrf={user.csrfToken} rows={data} districts={data.filter((d) => d.kind === "district").map((d) => ({ id: d.id, name: d.name }))} services={svc} />
    </AdminPage>
  );
}
