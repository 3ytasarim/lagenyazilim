import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegionPageView } from "@/components/regions/RegionPageView";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getRegionPage, getRegionPaths } from "@/server/queries/content";

/*
 * İlçe sayfası yalnızca yayın kapısından geçmiş bir bölge sayfası varsa render edilir; yoksa gerçek 404.
 * Bölge verisi var diye boş/şablon sayfa üretilmez.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getRegionPaths()).filter((p) => !p.alt).map((p) => ({ ilce: p.district }));
}

export async function generateMetadata({ params }: { params: Promise<{ ilce: string }> }): Promise<Metadata> {
  const { ilce } = await params;
  const page = await getRegionPage(ilce, null);
  if (!page) return {};
  return buildMetadata({
    path: `/hizmet-bolgeleri/ankara/${ilce}/`,
    title: page.seo.seoTitle ?? page.h1,
    description: page.seo.seoDescription ?? page.intro.slice(0, 160),
    absoluteTitle: !!page.seo.seoTitle,
    canonicalOverride: page.seo.canonicalOverride,
    keywords: page.seo.keywords,
    index: page.seo.robotsIndex,
    follow: page.seo.robotsFollow,
  });
}

export default async function DistrictPage({ params }: { params: Promise<{ ilce: string }> }) {
  const { ilce } = await params;
  const [page, business] = await Promise.all([getRegionPage(ilce, null), getBusiness()]);
  if (!page) notFound();
  return <RegionPageView page={page} path={`/hizmet-bolgeleri/ankara/${ilce}/`} business={business} />;
}
