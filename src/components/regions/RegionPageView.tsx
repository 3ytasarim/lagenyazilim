import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Handshake, MapPin, Target } from "lucide-react";
import { AnimatedWords } from "@/components/ui/AnimatedWords";
import { img } from "@/content/images";
import { ProjectCta } from "@/components/home/ProjectCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { FaqAccordion } from "@/components/ui/Accordion";
import { Breadcrumb, type Crumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { KeywordBanner, KeywordTags } from "@/components/ui/KeywordBanner";
import { ORG_ID, faqSchema, graph } from "@/lib/seo/schema";
import { absoluteUrl, formatAddress, type BusinessInfo } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import type { FaqItem, Service } from "@/types/content";

export type RegionPageData = {
  kind: "city" | "district" | "sub" | "combo";
  districtHasPage: boolean;
  region: { name: string; slug: string; kind: string };
  district: { name: string; slug: string };
  service: { name: string; slug: string } | null;
  h1: string;
  intro: string;
  localNeeds: string;
  localSectors: string;
  serviceModel: string;
  html: string;
  faqs: FaqItem[];
  relatedServices: Service[];
  siblings: { slug: string; name: string }[];
  updatedAt: string;
  seo?: { keywords?: string[] };
};

/**
 * Bölge sayfası. Şema: WebPage + Service(areaServed) + FAQPage. Bu bölgede ofis olmadığı için
 * LocalBusiness/adres üretilmez — tek fiziksel adres Çankaya ofisidir ve yalnızca o şekilde belirtilir.
 */
export function RegionPageView({ page, path, business }: { page: RegionPageData; path: string; business: BusinessInfo }) {
  const isCity = page.kind === "city";
  const crumbs: Crumb[] = isCity
    ? [
        { name: "Hizmet Bölgeleri", path: "/hizmet-bolgeleri/" },
        { name: page.region.name, path },
      ]
    : [
    { name: "Hizmet Bölgeleri", path: "/hizmet-bolgeleri/" },
    { name: "Ankara", path: "/hizmet-bolgeleri/ankara/" },
    ...(page.kind === "district" || page.districtHasPage ? [{ name: page.district.name, path: `/hizmet-bolgeleri/ankara/${page.district.slug}/` }] : []),
    ...(page.kind === "sub" ? [{ name: page.region.name, path }] : []),
    ...(page.kind === "combo" && page.service ? [{ name: page.service.name, path }] : []),
      ];
  const areaName = page.kind === "sub" ? `${page.region.name}, ${page.district.name}` : page.district.name;
  const quoteHref = page.service ? `/proje-teklifi/?hizmet=${page.relatedServices.find((s) => s.slug === page.service!.slug)?.quoteKey ?? ""}` : "/proje-teklifi/";
  const sections = [
    { id: "ihtiyaclar", icon: Target, title: `${areaName} işletmelerinin ihtiyaçları`, text: page.localNeeds },
    { id: "sektorler", icon: Building2, title: "Bölgedeki iş yapısı", text: page.localSectors },
    { id: "hizmet-modeli", icon: Handshake, title: "Bu bölgeye nasıl hizmet veriyoruz?", text: page.serviceModel },
  ].filter((s) => s.text.trim());
  // Ankara fotoğrafı yalnızca Ankara ilçe sayfalarında (il sayfalarında yanlış şehir görseli olmasın)
  const photo = isCity ? undefined : img("ankara");

  return (
    <article>
      <header className="under-header relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="orbs">
          <span />
          <span />
          <span />
        </div>
        <div className="container-site relative pt-8 pb-14 md:pt-10 md:pb-20">
          <Breadcrumb items={crumbs} />
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="fade-rise eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 backdrop-blur">
              <MapPin aria-hidden className="size-4 text-brand" /> {isCity ? `${areaName} · Türkiye` : `${areaName} · Ankara`}
            </p>
            <h1 className="mt-5 text-h1 text-balance">
              <AnimatedWords text={page.h1} />
            </h1>
            <p className="fade-rise mt-6 max-w-[62ch] text-lead text-ink-muted" style={{ "--d": 3 } as React.CSSProperties}>
              {page.intro}
            </p>
            <div className="fade-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": 4 } as React.CSSProperties}>
              <ButtonLink href={quoteHref} size="lg" data-event="service_cta_click" data-cta={`region:${page.region.slug}`}>
                Projeniz için teklif alın <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <ButtonLink href="/iletisim/" size="lg" variant="secondary">
                Bize ulaşın
              </ButtonLink>
            </div>
          </div>
          {photo ? (
            <div className="fade-rise relative lg:col-span-5" style={{ "--d": 2 } as React.CSSProperties}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line bg-surface-2 shadow-float">
                <Image src={photo.src} alt={photo.alt} fill loading="eager" sizes="(min-width: 1024px) 480px, 100vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[rgb(10_16_40/0.55)] to-transparent" />
              </div>
              <div aria-hidden className="glass-card float-a absolute -bottom-5 left-5 flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2 text-sm font-semibold">
                <span className="pulse-dot flex size-8 items-center justify-center rounded-full bg-brand text-on-brand">
                  <MapPin className="size-4" />
                </span>
                {areaName}
              </div>
            </div>
          ) : isCity ? (
            <div aria-hidden className="fade-rise relative lg:col-span-5" style={{ "--d": 2 } as React.CSSProperties}>
              <div className="glass-card ring-gradient relative overflow-hidden rounded-[28px] p-8">
                <div className="absolute -top-20 -right-16 size-56 rounded-full bg-brand/30 blur-3xl" />
                <p className="relative flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-brand uppercase">
                  <span className="pulse-dot flex size-6 items-center justify-center rounded-full bg-brand text-on-brand">
                    <MapPin className="size-3.5" />
                  </span>
                  Ankara → {areaName}
                </p>
                <p className="relative mt-4 font-display text-5xl font-semibold tracking-tight text-gradient">{areaName}</p>
                <ol className="relative mt-8 grid gap-4">
                  {["Çevrim içi keşif görüşmesi", "Tasarım ve onay paylaşılan bağlantıyla", "Yayın, panel eğitimi ve destek"].map((t, i) => (
                    <li key={t} className="flex items-center gap-3 text-[0.9375rem] font-medium">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong font-display text-sm tabular-nums">{i + 1}</span>
                      {t}
                    </li>
                  ))}
                </ol>
                <ul className="relative mt-8 flex flex-wrap gap-2">
                  {page.relatedServices.map((sv) => (
                    <li key={sv.slug} className="rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold text-brand">
                      {sv.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </header>

      <div className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="reveal mb-14 grid gap-5 last:mb-0 md:grid-cols-[56px_1fr]" data-reveal="blur" style={{ "--d": i % 2 } as React.CSSProperties}>
              <span aria-hidden className="flex size-12 items-center justify-center rounded-2xl bg-brand-tint text-brand">
                <s.icon className="size-6" />
              </span>
              <div>
                <h2 id={`${s.id}-h`} className="text-h2">
                  {s.title}
                </h2>
                <p className="mt-5 text-lead whitespace-pre-line text-ink-muted">{s.text}</p>
              </div>
            </section>
          ))}
          {page.html ? <div className="prose prose-lg prose-site mt-14" dangerouslySetInnerHTML={{ __html: page.html }} /> : null}

          {page.faqs.length ? (
            <section aria-labelledby="bolge-sss" className="mt-16">
              <h2 id="bolge-sss" className="mb-8 text-h2">
                {areaName} için sık sorulanlar
              </h2>
              <FaqAccordion items={page.faqs} />
            </section>
          ) : null}
          <KeywordTags keywords={page.seo?.keywords ?? []} label="Etiketler" className="mt-14" />
          <p className="mt-10 text-sm text-ink-soft">
            Son güncelleme: <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
          </p>
        </div>

        <aside className="lg:col-span-4">
          <div className="grid gap-6 lg:sticky lg:top-[calc(var(--header-h)+32px)]">
            <div className="spotlight lift rounded-[20px] border border-line bg-surface p-6">
              <p className="font-semibold">Ofisimiz</p>
              <p className="mt-2 text-[0.9375rem] text-ink-muted">{formatAddress(business)}</p>
              <p className="mt-3 text-sm text-ink-soft">{isCity
                  ? `${areaName} ilinde şubemiz yoktur; buradaki işletmelerle süreci çevrim içi yürütüyor, gerektiğinde yüz yüze görüşme planlıyoruz.`
                  : `${areaName} bölgesinde şubemiz yoktur; buradaki işletmelere Çankaya ofisimizden, yerinde ziyaretlerle ve çevrim içi hizmet veriyoruz.`}</p>
            </div>
            {page.siblings.length ? (
              <nav aria-label="Diğer bölgeler" className="spotlight lift rounded-[20px] border border-line bg-surface p-6">
                <p className="font-semibold">Diğer hizmet bölgeleri</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {page.siblings.map((s) => (
                    <li key={s.slug}>
                      <Link href={isCity ? `/hizmet-bolgeleri/${s.slug}/` : `/hizmet-bolgeleri/ankara/${s.slug}/`} className="inline-flex rounded-full border border-line-strong px-3 py-1 text-sm hover:border-brand hover:text-brand">
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        </aside>
      </div>

      {page.relatedServices.length ? (
        <section aria-labelledby="bolge-hizmetler" className="border-t border-line bg-surface-2/50 py-20">
          <div className="container-site">
            <h2 id="bolge-hizmetler" className="mb-10 text-h2">
              {areaName} için hizmetlerimiz
            </h2>
            <ServicesGrid services={page.relatedServices} />
          </div>
        </section>
      ) : null}

      <KeywordBanner keywords={page.seo?.keywords ?? []} title={`${areaName} için öne çıkan aramalar`} />

      <ProjectCta business={business} href={quoteHref} />
      <JsonLd
        data={graph(
          {
            "@type": "WebPage",
            "@id": `${absoluteUrl(path)}#webpage`,
            url: absoluteUrl(path),
            name: page.h1,
            inLanguage: "tr-TR",
            dateModified: page.updatedAt,
            isPartOf: { "@id": `${absoluteUrl("/")}#website` },
          },
          {
            "@type": "Service",
            name: page.service ? `${page.service.name} — ${areaName}` : `Web tasarım, yazılım ve dijital pazarlama — ${areaName}`,
            provider: { "@id": ORG_ID },
            areaServed: { "@type": "AdministrativeArea", name: `${areaName}, Ankara` },
            url: absoluteUrl(path),
          },
          faqSchema(page.faqs),
        )}
      />
    </article>
  );
}
