import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegionPageView } from "@/components/regions/RegionPageView";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getCities, getCityPage } from "@/server/queries/content";

/*
 * İl sayfası (Türkiye geneli). Yalnızca yayın kapısından geçmiş sayfa render edilir; yoksa gerçek 404.
 * Ankara'nın kendi hub sayfası (/hizmet-bolgeleri/ankara/) statik rota olarak önceliklidir.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getCities()).map((c) => ({ il: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ il: string }> }): Promise<Metadata> {
  const { il } = await params;
  const page = await getCityPage(il);
  if (!page) return {};
  return buildMetadata({
    path: `/hizmet-bolgeleri/${il}/`,
    title: page.seo.seoTitle ?? page.h1,
    description: page.seo.seoDescription ?? page.intro.slice(0, 160),
    absoluteTitle: !!page.seo.seoTitle,
    canonicalOverride: page.seo.canonicalOverride,
    keywords: page.seo.keywords,
    index: page.seo.robotsIndex,
    follow: page.seo.robotsFollow,
  });
}

export default async function CityPage({ params }: { params: Promise<{ il: string }> }) {
  const { il } = await params;
  const [page, business] = await Promise.all([getCityPage(il), getBusiness()]);
  if (!page) notFound();
  return <RegionPageView page={page} path={`/hizmet-bolgeleri/${il}/`} business={business} />;
}
