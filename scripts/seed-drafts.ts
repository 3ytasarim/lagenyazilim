import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { CANKAYA_DRAFT, DRAFT_POSTS } from "../src/content/drafts";
import * as schema from "../src/lib/db/schema";

/*
 * İçerik TASLAKLARI: 10 blog yazısı + Çankaya bölge sayfası. Hepsi status=draft.
 * Idempotent: aynı slug / bölge varsa dokunmaz.
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  try {
    const cats = await db.select({ id: schema.blogCategories.id, slug: schema.blogCategories.slug }).from(schema.blogCategories);
    const catId = new Map(cats.map((c) => [c.slug, c.id]));
    const words = (h: string) => h.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    const posts = await db
      .insert(schema.blogPosts)
      .values(
        DRAFT_POSTS.map((p) => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          bodyHtml: p.html,
          categoryId: catId.get(p.category) ?? null,
          readingMinutes: Math.max(1, Math.round(words(p.html) / 200)),
          seoTitle: p.seoTitle,
          seoDescription: p.seoDescription,
          status: "draft" as const,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: schema.blogPosts.id });
    console.log(`  blog taslakları: ${posts.length} yeni`);

    const [city] = await db.select().from(schema.regions).where(and(eq(schema.regions.slug, "ankara"), isNull(schema.regions.parentId))).limit(1);
    const [cankaya] = city ? await db.select().from(schema.regions).where(and(eq(schema.regions.parentId, city.id), eq(schema.regions.slug, "cankaya"))).limit(1) : [];
    if (cankaya) {
      const svc = await db.select({ id: schema.services.id, slug: schema.services.slug }).from(schema.services);
      const related = ["ankara-web-tasarim", "ankara-ozel-yazilim", "ankara-seo-hizmeti", "ankara-fotograf-cekimi"].map((s) => svc.find((x) => x.slug === s)?.id).filter((x): x is string => !!x);
      const rp = await db
        .insert(schema.regionPages)
        .values({ regionId: cankaya.id, serviceId: null, ...CANKAYA_DRAFT, relatedServiceIds: related, status: "draft" })
        .onConflictDoNothing()
        .returning({ id: schema.regionPages.id });
      console.log(`  bölge taslağı (Çankaya): ${rp.length} yeni`);
    }
    console.log("✓ Taslaklar tamamlandı.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
