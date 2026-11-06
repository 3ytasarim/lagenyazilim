import { MapPin, Phone } from "lucide-react";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { ProjectCta } from "@/components/home/ProjectCta";
import { WhyLagen } from "@/components/home/WhyLagen";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { img } from "@/content/images";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { buttonClass } from "@/components/ui/Button";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PROCESS } from "@/content/home";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getPage, getServices } from "@/server/queries/content";

export async function generateMetadata() {
  const page = await getPage("hakkimizda");
  return buildMetadata({
    path: "/hakkimizda/",
    title: page?.seo.seoTitle ?? PAGE_SEO.about.title,
    absoluteTitle: !page?.seo.seoTitle,
    description: page?.seo.seoDescription ?? PAGE_SEO.about.description,
    keywords: PAGE_SEO.about.keywords,
    canonicalOverride: page?.seo.canonicalOverride,
    index: page?.seo.robotsIndex ?? true,
  });
}

export default async function AboutPage() {
  const [business, services, page] = await Promise.all([getBusiness(), getServices(), getPage("hakkimizda")]);
  const aboutPhoto = img("team-meeting");

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Hakkımızda", path: "/hakkimizda/" }]}
        eyebrow="Kurumsal"
        title={page?.h1 ?? "Ankara'dan Türkiye'nin her yerine, işini büyütmek isteyen markalar için"}
        lead={page?.excerpt ?? undefined}
      />

      <Section labelledBy="about-title">
        {aboutPhoto ? (
          <div className="relative mb-16 aspect-[16/9] overflow-hidden rounded-[24px] border border-line bg-surface-2 md:aspect-[21/9]">
            <Image src={aboutPhoto.src} alt={aboutPhoto.alt} fill loading="eager" sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>
        ) : null}
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Mottomuz</p>
            <p id="about-title" className="mt-4 font-display text-h2">
              &ldquo;{business.slogan}&rdquo;
            </p>
          </div>
          <div className="space-y-5 text-lead text-ink-muted lg:col-span-7">
            <p>
              Bir projeye başladığımızda ilk sorduğumuz şey &ldquo;nasıl görünsün?&rdquo; değil, &ldquo;bu iş neyi değiştirmeli?&rdquo;
              sorusudur. Daha fazla teklif talebi, daha az telefonla sorulan aynı soru, bayilerin kendi başına bulabildiği ürün
              bilgisi ya da ekibin tablolardan kurtulması... Hedef netleştiğinde tasarım ve yazılım kararları da netleşir.
            </p>
            <p>
              Web sitesi, katalog, sosyal medya ve yazılım işlerini aynı ekip içinde yürütmemizin nedeni de bu: Markanızın her
              temas noktasında aynı dil konuşulsun, bir kanalda yapılan iş diğerini beslesin.
            </p>
          </div>
        </div>
      </Section>

      <WhyLagen withPhoto={false} />

      <Section labelledBy="process-title">
        <SectionHeading id="process-title" eyebrow="Süreç" title="Nasıl çalışıyoruz?" />
        <ProcessTimeline steps={PROCESS} />
      </Section>

      <Section labelledBy="services-title" tone="alt">
        <SectionHeading id="services-title" eyebrow="Hizmetler" title="Neler yapıyoruz?" />
        <ServicesGrid services={services} />
      </Section>

      <Section labelledBy="office-title">
        <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
          <div className="reveal spotlight relative overflow-hidden rounded-[24px] border border-line bg-surface p-7 md:p-9" data-reveal="left">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-brand/15 blur-3xl" />
            <span className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-cyan text-white">
              <MapPin aria-hidden className="size-6" />
            </span>
            <h2 id="office-title" className="relative mt-6 text-h2">
              Ofisimiz
            </h2>
            <address className="relative mt-4 text-lead not-italic text-ink-muted">
              <span className="block">
                {business.address.neighborhood}, {business.address.street}
              </span>
              <span className="block font-medium text-ink">
                {business.address.district} / {business.address.city}
              </span>
            </address>
            <div className="relative mt-7 flex flex-wrap gap-3">
              <a href={`tel:${business.phoneE164}`} className={buttonClass("secondary", "md")} data-event="phone_click">
                <Phone aria-hidden className="size-4" /> {business.phone}
              </a>
              <a href={`https://wa.me/${business.whatsappE164}`} target="_blank" rel="noopener" className={buttonClass("secondary", "md")} data-event="whatsapp_click">
                <WhatsAppIcon className="size-4 text-[var(--wa)]" /> WhatsApp
              </a>
            </div>
          </div>
          <div className="reveal flex flex-col justify-center rounded-[24px] border border-line bg-surface-2/50 p-7 md:p-9" data-reveal="right">
            <p className="eyebrow">Nasıl görüşürüz?</p>
            <p className="mt-4 text-lead text-ink-muted">
              Toplantılarımızı Ankara&apos;daki ofisimizde, işyerinizde ya da çevrim içi yapıyoruz. Türkiye&apos;nin diğer illerindeki işletmelerle süreci
              çevrim içi yürütüyor, gerektiğinde yüz yüze görüşme planlıyoruz.
            </p>
          </div>
        </div>
      </Section>

      <ProjectCta business={business} />
    </>
  );
}
