import { urlsetXml, XML_HEADERS } from "@/lib/seo/sitemap-xml";
import { SITEMAP_TYPES, sitemapEntries, type SitemapType } from "@/server/queries/sitemap";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const type = file.replace(/\.xml$/, "") as SitemapType;
  if (!file.endsWith(".xml") || !SITEMAP_TYPES.includes(type)) return new Response("Not found", { status: 404 });
  return new Response(urlsetXml(await sitemapEntries(type)), { headers: XML_HEADERS });
}
