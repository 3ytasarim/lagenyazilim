import { ProjectCta } from "@/components/home/ProjectCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getProjects } from "@/server/queries/content";

export async function generateMetadata() {
  const projects = await getProjects();
  return buildMetadata({
    path: "/projeler/",
    ...PAGE_SEO.projects,
    // Yayımlanmış proje yokken sayfa indekslenmez ve menüde görünmez.
    index: projects.length > 0,
  });
}

export default async function ProjectsPage() {
  const [projects, business] = await Promise.all([getProjects(), getBusiness()]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Projelerimiz", path: "/projeler/" }]}
        eyebrow="Projeler"
        title="Projelerimiz"
        lead="Burada yalnızca müşterilerimizin yayın izni verdiği projeler yer alır. Her projede sorunu, yaklaşımı ve teslim edilen işi anlatıyoruz."
      />
      <Section>
        {projects.length > 0 ? (
          <div className="grid gap-14 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Vaka analizleri hazırlanıyor"
            text="Müşterilerimizin onayıyla proje sayfalarını yayımlamaya hazırlanıyoruz. Benzer bir projeniz varsa örnek çalışmalarımızı görüşmede paylaşabiliriz."
            action={<ButtonLink href="/proje-teklifi/">Proje Teklifi Al</ButtonLink>}
          />
        )}
      </Section>
      <ProjectCta business={business} />
    </>
  );
}
