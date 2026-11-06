import { ProjectCta } from "@/components/home/ProjectCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { Section } from "@/components/ui/Section";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getServices } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/hizmetlerimiz/", ...PAGE_SEO.services });

export default async function ServicesPage() {
  const [services, business] = await Promise.all([getServices(), getBusiness()]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Hizmetlerimiz", path: "/hizmetlerimiz/" }]}
        eyebrow="Hizmetlerimiz"
        title="Web, yazılım ve dijital pazarlamada uçtan uca hizmet"
        lead="İhtiyacınız tek bir web sitesi de olabilir, satış ekibinizi destekleyecek bir katalog, sitenizi besleyen bir SEO planı ve iş süreçlerinizi yöneten bir yazılım da. Her hizmeti ayrı ayrı alabilir ya da birlikte planlayabilirsiniz."
      />
      <Section>
        <ServicesGrid services={services} headingLevel={2} />
      </Section>
      <ProjectCta business={business} />
    </>
  );
}
