import { indexXml, XML_HEADERS } from "@/lib/seo/sitemap-xml";
import { SITEMAP_TYPES, sitemapEntries } from "@/server/queries/sitemap";

export const dynamic = "force-dynamic";

/** Sitemap index — yalnızca içinde en az bir URL olan alt sitemap'ler listelenir. */
export async function GET() {
  const parts = await Promise.all(
    SITEMAP_TYPES.map(async (t) => {
      const entries = await sitemapEntries(t);
      const lastmod = entries.reduce<Date | undefined>((m, e) => (e.lastmod && (!m || e.lastmod > m) ? e.lastmod : m), undefined);
      return { type: t, count: entries.length, lastmod };
    }),
  );
  return new Response(indexXml(parts.filter((p) => p.count > 0).map((p) => ({ path: `/sitemaps/${p.type}.xml`, lastmod: p.lastmod }))), { headers: XML_HEADERS });
}
