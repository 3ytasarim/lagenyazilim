import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { CapabilityStrip } from "@/components/home/CapabilityStrip";
import { Hero } from "@/components/home/Hero";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { ProjectCta } from "@/components/home/ProjectCta";
import { CityLinks } from "@/components/regions/CityLinks";
import { WhyLagen } from "@/components/home/WhyLagen";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PROCESS } from "@/content/home";
import { img } from "@/content/images";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { graph, professionalServiceSchema } from "@/lib/seo/schema";
import { getBusiness, getDistricts, getFeaturedProjects, getLatestPosts, getServices } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/", ...PAGE_SEO.home });

export default async function HomePage() {
  const [business, services, districts, projects, posts] = await Promise.all([
    getBusiness(),
    getServices(),
    getDistricts(),
    getFeaturedProjects(4),
    getLatestPosts(3),
  ]);

  const ankara = img("ankara");
  const processImg = img("process");

  return (
    <>
      <Hero />
      <CapabilityStrip />

      <Section labelledBy="services-title">
        <SectionHeading
          id="services-title"
          eyebrow="Hizmetlerimiz"
          title="Markanızın dijitaldeki tüm temas noktaları için tek ekip"
          lead="Web sitesinden kataloğa, arama motoru görünürlüğünden iş süreçlerinizi yöneten yazılıma kadar birbiriyle konuşan çözümler."
          action={
            <Link href="/hizmetlerimiz/" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
              Tüm hizmetler <ArrowRight aria-hidden className="size-4" />
            </Link>
          }
        />
        <ServicesGrid services={services} />
      </Section>

      <WhyLagen />

      {projects.length > 0 ? (
        <Section labelledBy="projects-title">
          <SectionHeading id="projects-title" eyebrow="Seçili projeler" title="Birlikte çalıştığımız markalar" />
          <div className="grid gap-12 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section labelledBy="process-title" tone={projects.length > 0 ? "alt" : "default"}>
        <SectionHeading
          id="process-title"
          eyebrow="Nasıl çalışıyoruz?"
          title="Belirsizliği azaltan, adım adım ilerleyen bir süreç"
          lead="Her aşamanın sonunda onayınız alınır; bir sonraki adıma ne yapılacağı ve neden yapılacağı bilinerek geçilir."
        />
        {processImg ? (
          <div className="relative mb-14 aspect-[21/8] overflow-hidden rounded-[24px] border border-line bg-surface-2">
            <Image src={processImg.src} alt={processImg.alt} fill sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        ) : null}
        <ProcessTimeline steps={PROCESS} />
      </Section>

      <Section labelledBy="regions-title" tone="alt">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <SectionHeading
              id="regions-title"
              eyebrow="Hizmet bölgeleri"
              title="Türkiye'nin her yerindeki işletmelerle çalışıyoruz"
              lead="Ofisimiz Ankara Çankaya'da. Diğer illerdeki işletmelerle keşiften yayına kadar tüm süreci çevrim içi yürütüyor, gerektiğinde yüz yüze görüşme planlıyoruz."
              className="mb-8 md:mb-8"
            />
            <ButtonLink href="/hizmet-bolgeleri/" variant="secondary">
              Tüm hizmet bölgeleri
            </ButtonLink>
          </div>
          <div className="lg:col-span-7">
            {ankara ? (
              <figure className="relative mb-8 aspect-[16/8] overflow-hidden rounded-[24px] border border-line bg-surface-2">
                <Image src={ankara.src} alt={ankara.alt} fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
              </figure>
            ) : null}
            <CityLinks />
          </div>
        </div>
      </Section>

      {posts.length > 0 ? (
        <Section labelledBy="posts-title">
          <SectionHeading
            id="posts-title"
            eyebrow="Bilgi merkezi"
            title="Karar vermeden önce okuyun"
            action={
              <Link href="/blog/" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
                Tüm yazılar <ArrowRight aria-hidden className="size-4" />
              </Link>
            }
          />
          <div className="grid gap-10 md:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </Section>
      ) : null}

      <ProjectCta business={business} />

      <JsonLd data={graph(professionalServiceSchema(business, ["Türkiye", "Ankara"]))} />
    </>
  );
}
