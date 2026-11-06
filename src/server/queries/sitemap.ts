import "server-only";
import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, mediaAssets, pages, projects, regionPages, regions, services } from "@/lib/db/schema";
import { img, serviceImage } from "@/content/images";
import { mediaUrl } from "@/lib/media";

export type SitemapEntry = { path: string; lastmod?: Date; images?: string[] };

const largest = (v: Record<string, string> | null | undefined) => {
  const e = Object.entries(v ?? {}).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  return e ? mediaUrl(e[1]) : null;
};
export const SITEMAP_TYPES = ["pages", "services", "regions", "blog", "projects"] as const;
export type SitemapType = (typeof SITEMAP_TYPES)[number];

/** Canonical override başka bir adresi gösteriyorsa sayfa kendi adresiyle sitemap'e girmez. */
const selfCanonical = (override: string | null, path: string) => !override || override === path;
const liveIndexable = <T extends typeof services | typeof blogPosts | typeof projects | typeof pages | typeof regionPages>(t: T) =>
  and(eq(t.status, "published"), lte(t.publishedAt, sql`now()`), eq(t.robotsIndex, true));

/** Kodla tasarlanmış sabit sayfalar (içerik veritabanında değil). lastmod verilmez — uydurma tarih üretilmez. */
const STATIC_PAGES = ["/", "/hizmetlerimiz/", "/cozumler/", "/iletisim/", "/proje-teklifi/", "/ucretsiz-seo-analizi/", "/hizmet-bolgeleri/", "/hizmet-bolgeleri/ankara/"];

export async function sitemapEntries(type: SitemapType): Promise<SitemapEntry[]> {
  switch (type) {
    case "pages": {
      const rows = await db.select({ slug: pages.slug, updatedAt: pages.updatedAt, legal: pages.requiresLegalReview, canonicalOverride: pages.canonicalOverride }).from(pages).where(liveIndexable(pages));
      const [{ n: postCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).where(liveIndexable(blogPosts));
      const [{ n: projectCount } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(projects).where(and(liveIndexable(projects), eq(projects.clientConsent, true)));
      return [
        ...STATIC_PAGES.map((path) => ({ path, images: path === "/hizmet-bolgeleri/ankara/" ? [img("ankara")?.src].filter((x): x is string => !!x) : undefined })),
        ...(postCount > 0 ? [{ path: "/blog/" }] : []),
        ...(projectCount > 0 ? [{ path: "/projeler/" }] : []),
        ...rows.filter((r) => !r.legal && selfCanonical(r.canonicalOverride, `/${r.slug}/`)).map((r) => ({ path: `/${r.slug}/`, lastmod: r.updatedAt })),
      ];
    }
    case "services": {
      const rows = await db.select({ slug: services.slug, updatedAt: services.updatedAt, c: services.canonicalOverride }).from(services).where(liveIndexable(services));
      return rows
        .filter((r) => selfCanonical(r.c, `/${r.slug}/`))
        .map((r) => ({ path: `/${r.slug}/`, lastmod: r.updatedAt, images: [serviceImage(r.slug)?.src].filter((x): x is string => !!x) }));
    }
    case "blog": {
      const rows = await db
        .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, c: blogPosts.canonicalOverride, v: mediaAssets.variants })
        .from(blogPosts)
        .leftJoin(mediaAssets, eq(blogPosts.coverImageId, mediaAssets.id))
        .where(liveIndexable(blogPosts));
      return rows
        .filter((r) => selfCanonical(r.c, `/blog/${r.slug}/`))
        .map((r) => ({ path: `/blog/${r.slug}/`, lastmod: r.updatedAt, images: [largest(r.v)].filter((x): x is string => !!x) }));
    }
    case "projects": {
      const rows = await db.select({ slug: projects.slug, updatedAt: projects.updatedAt }).from(projects).where(and(liveIndexable(projects), eq(projects.clientConsent, true)));
      return rows.map((r) => ({ path: `/projeler/${r.slug}/`, lastmod: r.updatedAt }));
    }
    case "regions": {
      // Yalnızca yayın kapısını geçmiş, yayında ve indekslenebilir bölge sayfaları
      const rows = await db.execute<{ path: string; updated_at: Date }>(sql`
        select case when r.kind = 'city' then '/hizmet-bolgeleri/' || r.slug || '/' else
               '/hizmet-bolgeleri/ankara/' ||
               case when parent.kind = 'district' then parent.slug || '/' || r.slug when r.kind = 'district' then r.slug else r.slug end ||
               case when s.slug is not null then '/' || regexp_replace(s.slug, '^ankara-', '') else '' end || '/' end as path,
               rp.updated_at
        from ${regionPages} rp
        join ${regions} r on r.id = rp.region_id
        left join ${regions} parent on parent.id = r.parent_id and parent.kind <> 'city'
        left join ${services} s on s.id = rp.service_id
        where rp.status = 'published' and rp.published_at <= now() and rp.robots_index`);
      return rows.rows.map((r) => ({ path: r.path, lastmod: new Date(r.updated_at) }));
    }
  }
}

