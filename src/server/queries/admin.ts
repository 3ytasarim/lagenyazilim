import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLogs, contentRevisions, leads, mediaAssets, users } from "@/lib/db/schema";
import { mediaUrl, type MediaRef } from "@/lib/media";
import { listRevisions, toLocalInput } from "@/server/services/content";
import { fmtDateTime } from "@/components/admin/ui";
import type { SeoValues } from "@/components/admin/SeoPanel";

export async function mediaRef(id: string | null | undefined): Promise<MediaRef | null> {
  if (!id) return null;
  const [r] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  if (!r) return null;
  const largest = Object.entries(r.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  return { id: r.id, url: mediaUrl(largest?.[1] ?? ""), alt: r.alt, width: r.width, height: r.height, variants: r.variants };
}

export async function mediaRefs(ids: string[]): Promise<MediaRef[]> {
  if (ids.length === 0) return [];
  const rows = await db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => {
      const largest = Object.entries(r.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
      return { id: r.id, url: mediaUrl(largest?.[1] ?? ""), alt: r.alt, width: r.width, height: r.height, variants: r.variants };
    });
}

export async function revisionItems(entityType: string, entityId: string) {
  const revs = await listRevisions(entityType, entityId);
  const authorIds = [...new Set(revs.map((r) => r.createdById).filter((x): x is string => !!x))];
  const names = authorIds.length ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, authorIds)) : [];
  const nameOf = new Map(names.map((n) => [n.id, n.name]));
  return revs.map((r) => ({ id: r.id, createdAt: fmtDateTime(r.createdAt), note: r.note, author: r.createdById ? (nameOf.get(r.createdById) ?? null) : null }));
}

type SeoRow = {
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  canonicalOverride: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
};
export const seoValues = (r: SeoRow | undefined): SeoValues => ({
  slug: r?.slug ?? "",
  seoTitle: r?.seoTitle ?? null,
  seoDescription: r?.seoDescription ?? null,
  focusKeyword: r?.focusKeyword ?? null,
  secondaryKeywords: r?.secondaryKeywords ?? [],
  canonicalOverride: r?.canonicalOverride ?? null,
  robotsIndex: r?.robotsIndex ?? true,
  robotsFollow: r?.robotsFollow ?? true,
});

export const publishValues = (r?: { status: string; publishedAt: Date | null }) => ({ status: r?.status ?? "draft", publishedAt: toLocalInput(r?.publishedAt) });

/** Dashboard sayaçları — tamamı veritabanındaki gerçek kayıtlardan. */
export async function dashboardStats() {
  const q = (s: ReturnType<typeof sql>) => db.execute<{ n: number }>(s).then((r) => Number(r.rows[0]?.n ?? 0));
  const [quotesTotal, quotesNew, quotesWon, quotesClosed, seoAudits, leadsNew, postsLive, postsDraft, servicesLive, regionPagesLive, projectsLive] = await Promise.all([
    q(sql`select count(*)::int n from quote_requests where status <> 'archived'`),
    q(sql`select count(*)::int n from quote_requests where status = 'new'`),
    q(sql`select count(*)::int n from quote_requests where status = 'won'`),
    q(sql`select count(*)::int n from quote_requests where status in ('won','lost')`),
    q(sql`select count(*)::int n from leads where source = 'seo_audit'`),
    q(sql`select count(*)::int n from leads where status = 'new'`),
    q(sql`select count(*)::int n from blog_posts where status = 'published' and published_at <= now()`),
    q(sql`select count(*)::int n from blog_posts where status in ('draft','review')`),
    q(sql`select count(*)::int n from services where status = 'published' and published_at <= now()`),
    q(sql`select count(*)::int n from region_pages where status = 'published' and published_at <= now()`),
    q(sql`select count(*)::int n from projects where status = 'published' and published_at <= now()`),
  ]);
  return { quotesTotal, quotesNew, quotesWon, quotesClosed, seoAudits, leadsNew, postsLive, postsDraft, servicesLive, regionPagesLive, projectsLive };
}

export async function recentActivity(limit = 12) {
  return db
    .select({ id: auditLogs.id, action: auditLogs.action, entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt, actor: users.name })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function recentLeads(limit = 5) {
  return db.select({ id: leads.id, name: leads.name, source: leads.source, createdAt: leads.createdAt }).from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}

export { contentRevisions };

/** Editördeki iç bağlantı seçicisi için sitenin önemli adresleri. */
export async function linkTargets() {
  const { services: s, pages: p, blogPosts: b } = await import("@/lib/db/schema");
  const [svc, pg, posts] = await Promise.all([
    db.select({ slug: s.slug, name: s.name }).from(s).where(eq(s.status, "published")),
    db.select({ slug: p.slug, title: p.title }).from(p).where(eq(p.status, "published")),
    db.select({ slug: b.slug, title: b.title }).from(b).where(eq(b.status, "published")).orderBy(desc(b.publishedAt)).limit(30),
  ]);
  return [
    ...svc.map((x) => ({ label: x.name, href: `/${x.slug}/` })),
    { label: "Proje Teklifi", href: "/proje-teklifi/" },
    { label: "Ücretsiz SEO Analizi", href: "/ucretsiz-seo-analizi/" },
    { label: "İletişim", href: "/iletisim/" },
    { label: "Ankara hizmet bölgeleri", href: "/hizmet-bolgeleri/ankara/" },
    ...pg.filter((x) => x.slug === "hakkimizda").map(() => ({ label: "Hakkımızda", href: "/hakkimizda/" })),
    ...posts.map((x) => ({ label: `Blog: ${x.title}`, href: `/blog/${x.slug}/` })),
  ];
}
