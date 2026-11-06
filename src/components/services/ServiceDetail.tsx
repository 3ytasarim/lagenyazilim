import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { ProjectCta } from "@/components/home/ProjectCta";
import { CityLinks } from "@/components/regions/CityLinks";
import { FaqAccordion } from "@/components/ui/Accordion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AnimatedWords } from "@/components/ui/AnimatedWords";
import { ButtonLink } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { serviceImage } from "@/content/images";
import type { BusinessInfo } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import type { Region, Service } from "@/types/content";

const TOC = [
  { id: "yaklasim", label: "Yaklaşımımız" },
  { id: "kapsam", label: "Hizmet kapsamı" },
  { id: "surec", label: "Çalışma süreci" },
  { id: "sss", label: "Sık sorulan sorular" },
];

export function ServiceDetail({
  service,
  related,
  districts,
  business,
}: {
  service: Service;
  related: Service[];
  districts: Region[];
  business: BusinessInfo;
}) {
  const quoteHref = `/proje-teklifi/?hizmet=${service.quoteKey}`;
  const toc = service.faqs.length ? TOC : TOC.filter((t) => t.id !== "sss");
  const photo = serviceImage(service.slug);

  return (
    <article>
      {/* Hero */}
      <header className="under-header relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="orbs">
          <span />
          <span />
          <span />
        </div>
        <div className="container-site relative pt-8 pb-16 md:pt-10 md:pb-24">
          <Breadcrumb items={[{ name: "Hizmetlerimiz", path: "/hizmetlerimiz/" }, { name: service.name, path: `/${service.slug}/` }]} />
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-center">
            <div className={photo ? "lg:col-span-7" : "lg:col-span-8"}>
              <p className="eyebrow flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-tint text-brand">
                  <ServiceIcon name={service.icon} className="size-4" />
                </span>
                {service.shortName}
              </p>
              <h1 className="mt-6 text-h1 text-balance">
                <AnimatedWords text={service.h1} />
              </h1>
              <p className="fade-rise mt-6 max-w-[60ch] text-lead text-ink-muted" style={{ "--d": 3 } as React.CSSProperties}>
                {service.heroText}
              </p>
              <div className="fade-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": 4 } as React.CSSProperties}>
                <ButtonLink href={quoteHref} size="lg" data-event="service_cta_click" data-cta={`service-hero:${service.quoteKey}`}>
                  Bu hizmet için teklif alın <ArrowRight aria-hidden className="size-4" />
                </ButtonLink>
                {service.quoteKey === "seo" ? (
                  <ButtonLink href="/ucretsiz-seo-analizi/" size="lg" variant="secondary">
                    Ücretsiz SEO analizi
                  </ButtonLink>
                ) : (
                  <ButtonLink href="#kapsam" size="lg" variant="secondary">
                    Kapsamı inceleyin
                  </ButtonLink>
                )}
              </div>
            </div>
            {photo ? (
              <div className="lg:col-span-5">
                <div className="fade-rise relative aspect-[4/3] overflow-hidden rounded-[24px] border border-line bg-surface-2 shadow-float" style={{ "--d": 2 } as React.CSSProperties}>
                  <Image src={photo.src} alt={photo.alt} fill loading="eager" sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        {/* Sayfa içi gezinme */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-[calc(var(--header-h)+32px)]">
            <p className="eyebrow">Bu sayfada</p>
            <ul className="mt-4 grid gap-1 border-l border-line">
              {toc.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[0.9375rem] text-ink-muted hover:border-brand hover:text-ink">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-lg border border-line bg-surface p-5">
              <p className="font-semibold">Projenizi konuşalım</p>
              <p className="mt-2 text-sm text-ink-muted">İhtiyacınızı birkaç adımda anlatın, kapsam ve teklifle dönelim.</p>
              <ButtonLink href={quoteHref} size="sm" className="mt-4 w-full">
                Teklif alın
              </ButtonLink>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-9">
          {/* Kısa cevap */}
          <section aria-label="Kısaca" className="reveal ring-gradient rounded-[20px] bg-surface p-6 md:p-8" data-reveal="blur">
            <p className="eyebrow">Kısaca</p>
            <p className="mt-3 text-lg leading-relaxed text-ink">{service.shortAnswer}</p>
          </section>

          <section id="yaklasim" aria-labelledby="yaklasim-h" className="mt-20 grid gap-10 md:grid-cols-2">
            <div className="reveal" data-reveal="left">
              <p className="eyebrow">İhtiyaç</p>
              <h2 id="yaklasim-h" className="mt-4 text-h2">
                Sık karşılaştığımız tablo
              </h2>
              <p className="mt-5 text-ink-muted">{service.problem}</p>
            </div>
            <div className="reveal rounded-[20px] border border-line bg-surface p-7" data-reveal="right">
              <p className="eyebrow">Çözüm yaklaşımı</p>
              <h3 className="mt-4 text-h2">Nasıl ele alıyoruz?</h3>
              <p className="mt-5 text-ink-muted">{service.approach}</p>
            </div>
          </section>

          <section id="kapsam" aria-labelledby="kapsam-h" className="mt-20">
            <p className="eyebrow">Hizmet kapsamı</p>
            <h2 id="kapsam-h" className="mt-4 text-h2">
              {service.name} kapsamında neler var?
            </h2>
            <ul className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 [&>li]:bg-surface">
              {service.scope.map((s, i) => (
                <li key={s.title} className="reveal spotlight group p-6 md:p-7" style={{ "--d": i % 2 } as React.CSSProperties}>
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-tint font-display text-sm text-brand tabular-nums transition-colors duration-500 group-hover:bg-brand group-hover:text-on-brand">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[0.9375rem] text-ink-muted">{s.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-h3">Teslim edilenler</h3>
                <ul className="mt-5 grid gap-3">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex gap-3 text-ink-muted">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" strokeWidth={2.5} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-h3">Sık çalıştığımız sektörler</h3>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {service.sectors.map((s) => (
                    <li key={s} className="rounded-full border border-line-strong px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section id="surec" aria-labelledby="surec-h" className="mt-20">
            <p className="eyebrow">Çalışma süreci</p>
            <h2 id="surec-h" className="mt-4 text-h2">
              Adım adım ilerleyiş
            </h2>
            <ol className="mt-10 grid gap-0">
              {service.process.map((p, i) => (
                <li key={p.title} className="reveal group grid grid-cols-[48px_1fr] gap-5 border-t border-line py-6 transition-colors hover:border-brand md:grid-cols-[64px_220px_1fr]" style={{ "--d": i } as React.CSSProperties}>
                  <span className="font-display text-2xl text-brand tabular-nums transition-transform duration-500 ease-out-expo group-hover:translate-x-1">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="col-start-2 text-ink-muted md:col-start-3">{p.text}</p>
                </li>
              ))}
            </ol>
          </section>

          {service.bodyHtml ? <section aria-label="Ek bilgiler" className="prose prose-lg prose-site mt-20" dangerouslySetInnerHTML={{ __html: service.bodyHtml }} /> : null}

          {service.faqs.length > 0 ? (
            <section id="sss" aria-labelledby="sss-h" className="mt-20">
              <p className="eyebrow">Sık sorulan sorular</p>
              <h2 id="sss-h" className="mt-4 mb-8 text-h2">
                {service.name} hakkında merak edilenler
              </h2>
              <FaqAccordion items={service.faqs} />
            </section>
          ) : null}

          <section aria-labelledby="bolge-h" className="reveal mt-20 rounded-[20px] border border-line bg-surface p-6 md:p-8" data-reveal="scale">
            <h2 id="bolge-h" className="text-h3">
              Türkiye genelinde hizmet
            </h2>
            <p className="mt-3 max-w-[60ch] text-ink-muted">
              Türkiye&apos;nin her ilindeki işletmelerle süreci çevrim içi yürütüyoruz; ofisimiz Ankara Çankaya&apos;da. Bölgenize özel sayfalarımız:
            </p>
            <div className="mt-6">
              <CityLinks />
            </div>
          </section>

          <p className="mt-10 text-sm text-ink-soft">
            Son güncelleme: <time dateTime={service.updatedAt}>{formatDate(service.updatedAt)}</time>
          </p>
        </div>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-h" className="border-t border-line bg-surface-2/50 py-20 md:py-24">
          <div className="container-site">
            <h2 id="related-h" className="text-h2">
              İlgili hizmetler
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {related.map((r, i) => (
                <li key={r.slug} className="reveal" style={{ "--d": i } as React.CSSProperties}>
                  <Link href={`/${r.slug}/`} className="spotlight lift group flex h-full flex-col rounded-[20px] border border-line bg-surface p-6 hover:border-brand">
                    <span className="flex items-center justify-between">
                      <ServiceIcon name={r.icon} className="size-6 text-brand" />
                      <ArrowUpRight aria-hidden className="size-4 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                    </span>
                    <span className="mt-6 text-lg font-semibold">{r.name}</span>
                    <span className="mt-2 text-[0.9375rem] text-ink-muted">{r.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ProjectCta business={business} href={quoteHref} />
    </article>
  );
}
