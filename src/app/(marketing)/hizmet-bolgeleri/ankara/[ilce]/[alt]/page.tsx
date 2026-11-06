import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegionPageView } from "@/components/regions/RegionPageView";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getRegionPage, getRegionPaths } from "@/server/queries/content";

/* İlçeye bağlı mahalle/semt sayfası veya hizmet + ilçe birleşimi (/ankara/cankaya/web-tasarim/). Yayında değilse 404. */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getRegionPaths()).filter((p) => p.alt).map((p) => ({ ilce: p.district, alt: p.alt! }));
}

export async function generateMetadata({ params }: { params: Promise<{ ilce: string; alt: string }> }): Promise<Metadata> {
  const { ilce, alt } = await params;
  const page = await getRegionPage(ilce, alt);
  if (!page) return {};
  return buildMetadata({
    path: `/hizmet-bolgeleri/ankara/${ilce}/${alt}/`,
    title: page.seo.seoTitle ?? page.h1,
    description: page.seo.seoDescription ?? page.intro.slice(0, 160),
    absoluteTitle: !!page.seo.seoTitle,
    canonicalOverride: page.seo.canonicalOverride,
    keywords: page.seo.keywords,
    index: page.seo.robotsIndex,
    follow: page.seo.robotsFollow,
  });
}

export default async function SubRegionPage({ params }: { params: Promise<{ ilce: string; alt: string }> }) {
  const { ilce, alt } = await params;
  const [page, business] = await Promise.all([getRegionPage(ilce, alt), getBusiness()]);
  if (!page) notFound();
  return <RegionPageView page={page} path={`/hizmet-bolgeleri/ankara/${ilce}/${alt}/`} business={business} />;
}
