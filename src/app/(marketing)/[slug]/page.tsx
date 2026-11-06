import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServiceDetail } from "@/components/services/ServiceDetail";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqSchema, graph, serviceSchema } from "@/lib/seo/schema";
import { getBusiness, getDistricts, getLegalSlugs, getPage, getRelatedServices, getService, getServices } from "@/server/queries/content";
import { LegalPage } from "./legal";

/*
 * Kök seviyedeki içerik sayfaları:
 *  - hizmetler: /ankara-web-tasarim/ gibi eski URL'ler aynen korunur
 *  - yasal metinler: /kvkk-aydinlatma-metni/ ... (Sayfalar modülünden, tür = yasal)
 * Panelde yeni yayımlanan bir hizmet/sayfa ilk istekte üretilir (dynamicParams).
 */

type Params = { slug: string };
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Params[]> {
  const [services, legal] = await Promise.all([getServices(), getLegalSlugs()]);
  return [...services.map((s) => ({ slug: s.slug })), ...legal.map((slug) => ({ slug }))];
}

async function resolve(slug: string) {
  const service = await getService(slug);
  if (service) return { service, page: null };
  const page = await getPage(slug);
  return { service: null, page: page?.kind === "legal" ? page : null };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const { service, page } = await resolve(slug);
  if (page) {
    return buildMetadata({
      path: `/${page.slug}/`,
      title: page.seo.seoTitle ?? page.title,
      description: page.seo.seoDescription ?? page.excerpt ?? page.title,
      canonicalOverride: page.seo.canonicalOverride,
      // Hukuki onay bekleyen taslaklar indekslenmez
      index: page.seo.robotsIndex && !page.requiresLegalReview,
      follow: page.seo.robotsFollow,
    });
  }
  if (!service) return {};
  return buildMetadata({
    path: `/${service.slug}/`,
    title: service.seoTitle ?? service.h1,
    description: service.seoDescription ?? service.summary,
    absoluteTitle: !!service.seoTitle,
    canonicalOverride: service.canonicalOverride,
    keywords: service.keywords,
    index: service.robotsIndex ?? true,
    follow: service.robotsFollow ?? true,
  });
}

export default async function SlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { service, page } = await resolve(slug);
  if (page) return <LegalPage page={page} />;
  if (!service) notFound();

  const [related, districts, business] = await Promise.all([getRelatedServices(service), getDistricts(), getBusiness()]);
  const path = `/${service.slug}/`;
  return (
    <>
      <ServiceDetail service={service} related={related} districts={districts} business={business} />
      <JsonLd data={graph(serviceSchema(service, path), faqSchema(service.faqs))} />
    </>
  );
}
