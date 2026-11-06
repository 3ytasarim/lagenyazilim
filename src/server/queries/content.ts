import "server-only";
import { unstable_cache } from "next/cache";
import { and, asc, desc, eq, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  authors,
  blogCategories,
  blogPostTags,
  blogPosts,
  blogTags,
  budgetRanges,
  mediaAssets,
  pages,
  popups,
  projectServices,
  projects,
  quoteServiceOptions,
  regionPages,
  regions,
  serviceRelations,
  services,
} from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media";
import { getPublicSetting } from "@/lib/settings";
import { DEFAULT_BUSINESS, type BusinessInfo } from "@/lib/site";
import type { PostSummary, ProjectSummary, Region, Service, ServiceIcon } from "@/types/content";
import { CACHE_TAGS } from "@/server/services/content";

/*
 * Public okuma katmanı — yalnızca YAYINDAKİ kayıtlar (status=published ve publishedAt ≤ şimdi).
 * Sonuçlar önbellek etiketleriyle tutulur; admin'deki her kayıt ilgili etiketi temizler.
 * Zamanlanmış içerik için önbellek en geç 5 dakikada tazelenir.
 * Önbellekten dönen değerler JSON'a çevrildiği için tarih alanları ISO metin olarak döner.
 */

const live = <T extends { status: unknown; publishedAt: unknown }>(t: T) =>
  and(eq(t.status as typeof services.status, "published"), lte(t.publishedAt as typeof services.publishedAt, sql`now()`));

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : "");
/** Odak + ikincil anahtar kelimeleri tekilleştirip birleştirir. */
const kw = (focus: string | null | undefined, rest: string[] | null | undefined) => [...new Set([focus, ...(rest ?? [])].map((k) => k?.trim()).filter((k): k is string => !!k))];
const SHORT = 300;

type CoverRow = { variants: Record<string, string> | null; alt: string | null; width: number | null; height: number | null } | null;
function cover(m: CoverRow) {
  if (!m?.variants) return null;
  const largest = Object.entries(m.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  if (!largest) return null;
  return { src: mediaUrl(largest[1]), alt: m.alt ?? "", width: m.width ?? 1600, height: m.height ?? 1000 };
}

/* ---------- Firma bilgisi ---------- */

export async function getBusiness(): Promise<BusinessInfo> {
  try {
    return await getPublicSetting("business");
  } catch {
    return DEFAULT_BUSINESS;
  }
}

/* ---------- Hizmetler ---------- */

const loadServices = unstable_cache(
  async (): Promise<Service[]> => {
    const rows = await db.select().from(services).where(live(services)).orderBy(asc(services.sortOrder), asc(services.name));
    const rel = rows.length ? await db.select().from(serviceRelations).where(inArray(serviceRelations.serviceId, rows.map((r) => r.id))).orderBy(asc(serviceRelations.sortOrder)) : [];
    const slugOf = new Map(rows.map((r) => [r.id, r.slug]));
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      shortName: r.shortName,
      h1: r.h1,
      summary: r.summary,
      heroText: r.heroText,
      shortAnswer: r.shortAnswer,
      icon: r.icon as ServiceIcon,
      problem: r.problem,
      approach: r.approach,
      scope: r.scope,
      deliverables: r.deliverables,
      sectors: r.sectors,
      process: r.process,
      faqs: r.faqs,
      related: rel.filter((x) => x.serviceId === r.id).map((x) => slugOf.get(x.relatedId)).filter((s): s is string => !!s),
      quoteKey: r.quoteKey ?? "",
      sortOrder: r.sortOrder,
      bodyHtml: r.bodyHtml,
      seoTitle: r.seoTitle,
      seoDescription: r.seoDescription,
      canonicalOverride: r.canonicalOverride,
      robotsIndex: r.robotsIndex,
      robotsFollow: r.robotsFollow,
      keywords: kw(r.focusKeyword, r.secondaryKeywords),
      updatedAt: iso(r.updatedAt),
    }));
  },
  ["services:live"],
  { tags: [CACHE_TAGS.services], revalidate: SHORT },
);

export const getServices = () => loadServices();

export async function getService(slug: string): Promise<Service | null> {
  return (await loadServices()).find((s) => s.slug === slug) ?? null;
}

export async function getRelatedServices(service: Service): Promise<Service[]> {
  const all = await loadServices();
  return service.related.map((slug) => all.find((s) => s.slug === slug)).filter((s): s is Service => Boolean(s));
}

/* ---------- Bölgeler ---------- */

export const getDistricts = unstable_cache(
  async (): Promise<Region[]> => {
    const [city] = await db.select({ id: regions.id }).from(regions).where(and(eq(regions.slug, "ankara"), isNull(regions.parentId))).limit(1);
    if (!city) return [];
    const rows = await db
      .select({
        slug: regions.slug,
        name: regions.name,
        priority: regions.priority,
        hasPage: sql<boolean>`exists (select 1 from ${regionPages} rp where rp.region_id = "regions"."id" and rp.service_id is null and rp.status = 'published' and rp.published_at <= now() and rp.robots_index)`,
      })
      .from(regions)
      .where(and(eq(regions.parentId, city.id), eq(regions.kind, "district")))
      .orderBy(asc(regions.priority), asc(regions.name));
    // Türkçe alfabetik sıralama (Ç, Ş, İ...) — öncelik grubu içinde
    return rows
      .map((r) => ({ slug: r.slug, name: r.name, priority: r.priority, kind: "district" as const, hasPage: Boolean(r.hasPage) }))
      .sort((a, b) => a.priority - b.priority || (a.priority === 1 ? 0 : a.name.localeCompare(b.name, "tr")));
  },
  ["regions:ankara"],
  { tags: ["regions"], revalidate: SHORT },
);

/* ---------- Blog ---------- */

const postSelect = {
  id: blogPosts.id,
  slug: blogPosts.slug,
  title: blogPosts.title,
  excerpt: blogPosts.excerpt,
  publishedAt: blogPosts.publishedAt,
  updatedAt: blogPosts.updatedAt,
  readingMinutes: blogPosts.readingMinutes,
  categorySlug: blogCategories.slug,
  categoryName: blogCategories.name,
  coverVariants: mediaAssets.variants,
  coverAlt: mediaAssets.alt,
  coverW: mediaAssets.width,
  coverH: mediaAssets.height,
};
type PostRow = { slug: string; title: string; excerpt: string; publishedAt: Date | null; updatedAt: Date; readingMinutes: number; categorySlug: string | null; categoryName: string | null; coverVariants: Record<string, string> | null; coverAlt: string | null; coverW: number | null; coverH: number | null };
const toSummary = (r: PostRow): PostSummary => ({
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt,
  category: r.categorySlug ? { slug: r.categorySlug, name: r.categoryName ?? "" } : null,
  publishedAt: iso(r.publishedAt),
  updatedAt: iso(r.updatedAt),
  readingMinutes: r.readingMinutes,
  cover: cover(r.coverVariants ? { variants: r.coverVariants, alt: r.coverAlt, width: r.coverW, height: r.coverH } : null),
});

export const getPosts = unstable_cache(
  async (opts: { page: number; category?: string; q?: string; perPage?: number }): Promise<{ items: PostSummary[]; total: number }> => {
    const per = opts.perPage ?? 9;
    const where = and(
      live(blogPosts),
      opts.category ? eq(blogCategories.slug, opts.category) : undefined,
      opts.q ? or(ilike(blogPosts.title, `%${opts.q}%`), ilike(blogPosts.excerpt, `%${opts.q}%`)) : undefined,
    );
    const base = db.select(postSelect).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).leftJoin(mediaAssets, eq(blogPosts.coverImageId, mediaAssets.id));
    const [rows, [count]] = await Promise.all([
      base.where(where).orderBy(desc(blogPosts.publishedAt)).limit(per).offset((Math.max(1, opts.page) - 1) * per),
      db.select({ n: sql<number>`count(*)::int` }).from(blogPosts).leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id)).where(where),
    ]);
    return { items: rows.map(toSummary), total: count?.n ?? 0 };
  },
  ["posts:list"],
  { tags: [CACHE_TAGS.posts], revalidate: SHORT },
);

export async function getLatestPosts(limit = 3): Promise<PostSummary[]> {
  return (await getPosts({ page: 1, perPage: limit })).items;
}

export const getPostCategories = unstable_cache(
  async () =>
    db
      .select({ slug: blogCategories.slug, name: blogCategories.name })
      .from(blogCategories)
      .where(sql`exists (select 1 from ${blogPosts} p where p.category_id = "blog_categories"."id" and p.status = 'published' and p.published_at <= now())`)
      .orderBy(asc(blogCategories.sortOrder)),
  ["posts:categories"],
  { tags: [CACHE_TAGS.posts, CACHE_TAGS.taxonomy], revalidate: SHORT },
);

export const getPost = unstable_cache(
  async (slug: string) => {
    const [r] = await db
      .select({ ...postSelect, bodyHtml: blogPosts.bodyHtml, toc: blogPosts.toc, sources: blogPosts.sources, categoryId: blogPosts.categoryId, seoTitle: blogPosts.seoTitle, seoDescription: blogPosts.seoDescription, focusKeyword: blogPosts.focusKeyword, secondaryKeywords: blogPosts.secondaryKeywords, canonicalOverride: blogPosts.canonicalOverride, robotsIndex: blogPosts.robotsIndex, robotsFollow: blogPosts.robotsFollow, ogImageId: blogPosts.ogImageId, authorName: authors.name, authorSlug: authors.slug, authorJob: authors.jobTitle, authorBio: authors.bio, authorVerified: authors.isVerified, authorSameAs: authors.sameAs })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(mediaAssets, eq(blogPosts.coverImageId, mediaAssets.id))
      .leftJoin(authors, eq(blogPosts.authorId, authors.id))
      .where(and(eq(blogPosts.slug, slug), live(blogPosts)))
      .limit(1);
    if (!r) return null;
    let og: ReturnType<typeof cover> = null;
    if (r.ogImageId) {
      const [m] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, r.ogImageId)).limit(1);
      og = cover(m ? { variants: m.variants, alt: m.alt, width: m.width, height: m.height } : null);
    }
    const related = await db
      .select(postSelect)
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(mediaAssets, eq(blogPosts.coverImageId, mediaAssets.id))
      .where(and(live(blogPosts), sql`${blogPosts.id} <> ${r.id}`, r.categoryId ? eq(blogPosts.categoryId, r.categoryId) : undefined))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(3);
    const tags = await db
      .select({ slug: blogTags.slug, name: blogTags.name })
      .from(blogPostTags)
      .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, r.id))
      .orderBy(asc(blogTags.name));
    return {
      ...toSummary(r),
      tags,
      html: r.bodyHtml,
      toc: r.toc,
      sources: r.sources,
      author: r.authorName ? { name: r.authorName, slug: r.authorSlug ?? "", jobTitle: r.authorJob, bio: r.authorBio, isVerified: Boolean(r.authorVerified), sameAs: r.authorSameAs ?? [] } : null,
      seo: { seoTitle: r.seoTitle, seoDescription: r.seoDescription, canonicalOverride: r.canonicalOverride, robotsIndex: r.robotsIndex, robotsFollow: r.robotsFollow, keywords: kw(r.focusKeyword, r.secondaryKeywords) },
      ogImage: og,
      related: related.map(toSummary),
    };
  },
  ["posts:detail"],
  { tags: [CACHE_TAGS.posts], revalidate: SHORT },
);

/* ---------- Projeler ---------- */

const loadProjects = unstable_cache(
  async () => {
    const rows = await db
      .select({ id: projects.id, slug: projects.slug, title: projects.title, clientName: projects.clientName, sector: projects.sector, summary: projects.summary, isFeatured: projects.isFeatured, v: mediaAssets.variants, alt: mediaAssets.alt, w: mediaAssets.width, h: mediaAssets.height })
      .from(projects)
      .leftJoin(mediaAssets, eq(projects.coverImageId, mediaAssets.id))
      .where(and(live(projects), eq(projects.clientConsent, true)))
      .orderBy(asc(projects.sortOrder), desc(projects.publishedAt));
    const ps = rows.length ? await db.select({ projectId: projectServices.projectId, name: services.shortName }).from(projectServices).innerJoin(services, eq(projectServices.serviceId, services.id)).where(inArray(projectServices.projectId, rows.map((r) => r.id))) : [];
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      clientName: r.clientName,
      sector: r.sector,
      summary: r.summary,
      isFeatured: r.isFeatured,
      services: ps.filter((p) => p.projectId === r.id).map((p) => p.name),
      cover: cover(r.v ? { variants: r.v, alt: r.alt, width: r.w, height: r.h } : null),
    }));
  },
  ["projects:live"],
  { tags: [CACHE_TAGS.projects], revalidate: SHORT },
);

export async function getProjects(): Promise<ProjectSummary[]> {
  return loadProjects();
}

export async function getFeaturedProjects(limit = 4): Promise<ProjectSummary[]> {
  const all = await loadProjects();
  const featured = all.filter((p) => p.isFeatured);
  return (featured.length ? featured : all).slice(0, limit);
}

export const getProject = unstable_cache(
  async (slug: string) => {
    const [r] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.slug, slug), live(projects), eq(projects.clientConsent, true)))
      .limit(1);
    if (!r) return null;
    const mediaIds = [r.coverImageId, ...r.gallery].filter((x): x is string => !!x);
    const media = mediaIds.length ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds)) : [];
    const byId = new Map(media.map((m) => [m.id, cover({ variants: m.variants, alt: m.alt, width: m.width, height: m.height })]));
    const svc = await db.select({ name: services.name, slug: services.slug }).from(projectServices).innerJoin(services, eq(projectServices.serviceId, services.id)).where(eq(projectServices.projectId, r.id));
    return {
      slug: r.slug,
      title: r.title,
      clientName: r.clientName,
      sector: r.sector,
      summary: r.summary,
      challenge: r.challenge,
      solution: r.solution,
      results: r.results,
      html: r.bodyHtml,
      liveUrl: r.liveUrl,
      year: r.year,
      cover: r.coverImageId ? (byId.get(r.coverImageId) ?? null) : null,
      gallery: r.gallery.map((g) => byId.get(g)).filter((x): x is NonNullable<typeof x> => !!x),
      services: svc,
      seo: { seoTitle: r.seoTitle, seoDescription: r.seoDescription, canonicalOverride: r.canonicalOverride, robotsIndex: r.robotsIndex, robotsFollow: r.robotsFollow },
      updatedAt: iso(r.updatedAt),
    };
  },
  ["projects:detail"],
  { tags: [CACHE_TAGS.projects], revalidate: SHORT },
);

/* ---------- Sayfalar ---------- */

export const getPage = unstable_cache(
  async (slug: string) => {
    const [r] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.slug, slug), live(pages)))
      .limit(1);
    if (!r) return null;
    return {
      slug: r.slug,
      kind: r.kind,
      title: r.title,
      h1: r.h1 ?? r.title,
      excerpt: r.excerpt,
      html: r.bodyHtml,
      requiresLegalReview: r.requiresLegalReview,
      version: r.version,
      seo: { seoTitle: r.seoTitle, seoDescription: r.seoDescription, canonicalOverride: r.canonicalOverride, robotsIndex: r.robotsIndex, robotsFollow: r.robotsFollow },
      updatedAt: iso(r.updatedAt),
    };
  },
  ["pages:detail"],
  { tags: [CACHE_TAGS.pages], revalidate: SHORT },
);

export const getLegalSlugs = unstable_cache(
  async () => (await db.select({ slug: pages.slug }).from(pages).where(and(eq(pages.kind, "legal"), live(pages)))).map((r) => r.slug),
  ["pages:legal-slugs"],
  { tags: [CACHE_TAGS.pages], revalidate: SHORT },
);

/* ---------- Teklif formu seçenekleri ---------- */

export const getQuoteOptions = unstable_cache(
  async () => {
    const [opts, budgets] = await Promise.all([
      db.select().from(quoteServiceOptions).where(eq(quoteServiceOptions.isActive, true)).orderBy(asc(quoteServiceOptions.sortOrder)),
      db.select().from(budgetRanges).where(eq(budgetRanges.isActive, true)).orderBy(asc(budgetRanges.sortOrder)),
    ]);
    return {
      services: opts.map((o) => ({ key: o.key, label: o.label, description: o.description ?? "", extraFields: o.extraFields })),
      budgets: budgets.map((b) => ({ id: b.id, label: b.label })),
    };
  },
  ["quote:options"],
  { tags: ["quote-options"], revalidate: 3600 },
);

/* ---------- Bölge sayfaları ---------- */

/**
 * /hizmet-bolgeleri/ankara/[ilce]/[alt?]/ çözümü. `alt`: önce ilçeye bağlı mahalle/semt, yoksa hizmet (web-tasarim → ankara-web-tasarim).
 * Yalnızca yayımlanmış ve yayın kapısından geçmiş (status=published) sayfalar döner.
 */
export const getRegionPage = unstable_cache(
  async (districtSlug: string, alt: string | null) => {
    const [city] = await db.select({ id: regions.id }).from(regions).where(and(eq(regions.slug, "ankara"), isNull(regions.parentId))).limit(1);
    if (!city) return null;
    const [district] = await db.select().from(regions).where(and(eq(regions.parentId, city.id), eq(regions.slug, districtSlug), eq(regions.kind, "district"))).limit(1);
    if (!district) return null;

    let region = district;
    let service: { id: string; slug: string; name: string } | null = null;
    if (alt) {
      const [child] = await db.select().from(regions).where(and(eq(regions.parentId, district.id), eq(regions.slug, alt))).limit(1);
      if (child) region = child;
      else {
        const [svc] = await db.select({ id: services.id, slug: services.slug, name: services.name }).from(services).where(and(or(eq(services.slug, `ankara-${alt}`), eq(services.slug, alt)), live(services))).limit(1);
        if (!svc) return null;
        service = svc;
      }
    }
    const [page] = await db
      .select()
      .from(regionPages)
      .where(and(eq(regionPages.regionId, region.id), service ? eq(regionPages.serviceId, service.id) : isNull(regionPages.serviceId), live(regionPages)))
      .limit(1);
    if (!page) return null;

    const all = await loadServices();
    const svcRows = page.relatedServiceIds.length ? await db.select({ id: services.id, slug: services.slug }).from(services).where(inArray(services.id, page.relatedServiceIds)) : [];
    const relatedServices = svcRows.map((r) => all.find((s) => s.slug === r.slug)).filter((s): s is Service => !!s);

    // Kardeş sayfalar (iç bağlantı): yayındaki diğer ilçe sayfaları
    const siblings = await db.execute<{ slug: string; name: string }>(sql`
      select r.slug, r.name from ${regionPages} rp join ${regions} r on r.id = rp.region_id
      where rp.service_id is null and r.kind = 'district' and r.parent_id = ${city.id} and r.id <> ${district.id}
        and rp.status = 'published' and rp.published_at <= now() and rp.robots_index
      order by r.priority, r.name limit 12`);

    // Üst ilçe sayfası yayında değilse breadcrumb ona bağlantı vermez (kırık iç bağlantı olmasın)
    const [districtPage] = region.id === district.id && !service ? [page] : await db.select({ id: regionPages.id }).from(regionPages).where(and(eq(regionPages.regionId, district.id), isNull(regionPages.serviceId), live(regionPages))).limit(1);

    return {
      districtHasPage: Boolean(districtPage),
      kind: service ? ("combo" as const) : region.kind === "district" ? ("district" as const) : ("sub" as const),
      region: { name: region.name, slug: region.slug, kind: region.kind },
      district: { name: district.name, slug: district.slug },
      service: service ? { name: service.name, slug: service.slug } : null,
      title: page.title,
      h1: page.h1,
      intro: page.intro,
      localNeeds: page.localNeeds,
      localSectors: page.localSectors,
      serviceModel: page.serviceModel,
      html: page.bodyHtml,
      faqs: page.faqs,
      relatedServices,
      siblings: siblings.rows,
      seo: { seoTitle: page.seoTitle, seoDescription: page.seoDescription, canonicalOverride: page.canonicalOverride, robotsIndex: page.robotsIndex, robotsFollow: page.robotsFollow, keywords: kw(page.focusKeyword, page.secondaryKeywords) },
      updatedAt: iso(page.updatedAt),
    };
  },
  ["regions:page"],
  { tags: ["regions"], revalidate: SHORT },
);

/** Türkiye geneli il sayfası (Ankara hariç — Ankara'nın kendi hub ve ilçe sayfaları var). Yalnızca yayın kapısını geçmiş sayfa. */
export const getCityPage = unstable_cache(
  async (citySlug: string) => {
    if (citySlug === "ankara") return null;
    const [city] = await db.select().from(regions).where(and(eq(regions.slug, citySlug), isNull(regions.parentId), eq(regions.kind, "city"))).limit(1);
    if (!city) return null;
    const [page] = await db.select().from(regionPages).where(and(eq(regionPages.regionId, city.id), isNull(regionPages.serviceId), live(regionPages))).limit(1);
    if (!page) return null;
    const all = await loadServices();
    const svcRows = page.relatedServiceIds.length ? await db.select({ id: services.id, slug: services.slug }).from(services).where(inArray(services.id, page.relatedServiceIds)) : [];
    const relatedServices = svcRows.map((r) => all.find((s) => s.slug === r.slug)).filter((s): s is Service => !!s);
    const siblings = await db.execute<{ slug: string; name: string }>(sql`
      select r.slug, r.name from ${regionPages} rp join ${regions} r on r.id = rp.region_id
      where rp.service_id is null and r.kind = 'city' and r.parent_id is null and r.id <> ${city.id}
        and rp.status = 'published' and rp.published_at <= now() and rp.robots_index
      order by r.priority, r.name`);
    return {
      districtHasPage: false,
      kind: "city" as const,
      region: { name: city.name, slug: city.slug, kind: city.kind },
      district: { name: city.name, slug: city.slug },
      service: null,
      title: page.title,
      h1: page.h1,
      intro: page.intro,
      localNeeds: page.localNeeds,
      localSectors: page.localSectors,
      serviceModel: page.serviceModel,
      html: page.bodyHtml,
      faqs: page.faqs,
      relatedServices,
      siblings: [{ slug: "ankara", name: "Ankara" }, ...siblings.rows],
      seo: { seoTitle: page.seoTitle, seoDescription: page.seoDescription, canonicalOverride: page.canonicalOverride, robotsIndex: page.robotsIndex, robotsFollow: page.robotsFollow, keywords: kw(page.focusKeyword, page.secondaryKeywords) },
      updatedAt: iso(page.updatedAt),
    };
  },
  ["regions:city-page"],
  { tags: ["regions"], revalidate: SHORT },
);

/** Yayında il sayfası olan şehirler (hub, footer, ana sayfa bağlantıları). */
export const getCities = unstable_cache(
  async (): Promise<{ slug: string; name: string }[]> => {
    const rows = await db.execute<{ slug: string; name: string }>(sql`
      select r.slug, r.name from ${regionPages} rp join ${regions} r on r.id = rp.region_id
      where rp.service_id is null and r.kind = 'city' and r.parent_id is null and r.slug <> 'ankara'
        and rp.status = 'published' and rp.published_at <= now() and rp.robots_index
      order by r.priority, r.name`);
    return rows.rows.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  },
  ["regions:cities"],
  { tags: ["regions"], revalidate: SHORT },
);

/** Statik üretim için yayındaki bölge sayfalarının yolları. */
export const getRegionPaths = unstable_cache(
  async () => {
    const rows = await db.execute<{ district: string; alt: string | null }>(sql`
      select coalesce(parent.slug, r.slug) as district,
             case when parent.slug is not null then r.slug when s.slug is not null then regexp_replace(s.slug, '^ankara-', '') else null end as alt
      from ${regionPages} rp
      join ${regions} r on r.id = rp.region_id
      left join ${regions} parent on parent.id = r.parent_id and parent.kind = 'district'
      left join ${services} s on s.id = rp.service_id
      where rp.status = 'published' and rp.published_at <= now()`);
    return rows.rows;
  },
  ["regions:paths"],
  { tags: ["regions"], revalidate: SHORT },
);

/* ---------- Duyuru penceresi ---------- */

/** Şu an yayında olan en son başlamış duyuru. Bitiş anı istemcide de kontrol edilir (önbellek gecikmesine karşı). */
export const getActivePopup = unstable_cache(
  async () => {
    const [r] = await db
      .select({ id: popups.id, alt: popups.alt, linkUrl: popups.linkUrl, linkLabel: popups.linkLabel, startsAt: popups.startsAt, endsAt: popups.endsAt, delayMs: popups.delayMs, variants: mediaAssets.variants, width: mediaAssets.width, height: mediaAssets.height })
      .from(popups)
      .innerJoin(mediaAssets, eq(popups.imageId, mediaAssets.id))
      .where(and(eq(popups.isActive, true), lte(popups.startsAt, sql`now()`), sql`${popups.endsAt} > now()`))
      .orderBy(desc(popups.startsAt))
      .limit(1);
    if (!r) return null;
    const largest = Object.entries(r.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
    if (!largest) return null;
    return { id: r.id, src: mediaUrl(largest[1]), width: r.width ?? 1536, height: r.height ?? 1024, alt: r.alt, linkUrl: r.linkUrl, linkLabel: r.linkLabel, startsAt: r.startsAt.toISOString(), endsAt: r.endsAt.toISOString(), delayMs: r.delayMs };
  },
  ["popups:active"],
  { tags: ["popups"], revalidate: 300 },
);
