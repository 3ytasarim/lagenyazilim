import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ProjectCta } from "@/components/home/ProjectCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buildMetadata } from "@/lib/seo/metadata";
import { ORG_ID, graph } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/site";
import { getBusiness, getProject, getProjects } from "@/server/queries/content";

/* Yalnızca müşteri izinli ve yayımlanmış projeler. */
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return buildMetadata({
    path: `/projeler/${p.slug}/`,
    title: p.seo.seoTitle ?? `${p.clientName}: ${p.title}`,
    description: p.seo.seoDescription ?? p.summary,
    image: p.cover ? { url: p.cover.src, width: p.cover.width, height: p.cover.height, alt: p.cover.alt } : null,
    canonicalOverride: p.seo.canonicalOverride,
    index: p.seo.robotsIndex,
    follow: p.seo.robotsFollow,
  });
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const [p, business] = await Promise.all([getProject((await params).slug), getBusiness()]);
  if (!p) notFound();
  const sections = [
    { h: "İhtiyaç", t: p.challenge },
    { h: "Çözüm", t: p.solution },
    { h: "Sonuçlar", t: p.results },
  ].filter((s) => s.t);

  return (
    <article>
      <header className="border-b border-line">
        <div className="container-site pt-8 pb-12 md:pt-10 md:pb-16">
          <Breadcrumb items={[{ name: "Projelerimiz", path: "/projeler/" }, { name: p.clientName, path: `/projeler/${p.slug}/` }]} />
          <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="eyebrow">{p.sector}</p>
              <h1 className="mt-4 text-h1">{p.title}</h1>
              <p className="mt-5 max-w-[60ch] text-lead text-ink-muted">{p.summary}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-[0.9375rem] lg:col-span-4">
              <div>
                <dt className="text-ink-soft">Müşteri</dt>
                <dd className="font-semibold">{p.clientName}</dd>
              </div>
              {p.year ? (
                <div>
                  <dt className="text-ink-soft">Yıl</dt>
                  <dd className="font-semibold">{p.year}</dd>
                </div>
              ) : null}
              <div className="col-span-2">
                <dt className="text-ink-soft">Hizmetler</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {p.services.map((s) => (
                    <Link key={s.slug} href={`/${s.slug}/`} className="rounded-full border border-line-strong px-3 py-1 text-sm hover:border-brand hover:text-brand">
                      {s.name}
                    </Link>
                  ))}
                </dd>
              </div>
              {p.liveUrl ? (
                <div className="col-span-2">
                  <a href={p.liveUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline" data-event="outbound_click">
                    Siteyi ziyaret edin <ExternalLink aria-hidden className="size-4" />
                  </a>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
        {p.cover ? (
          <div className="container-site pb-12">
            <Image src={p.cover.src} alt={p.cover.alt} width={p.cover.width} height={p.cover.height} priority sizes="(min-width: 1320px) 1240px, 100vw" className="w-full rounded-lg" />
          </div>
        ) : null}
      </header>

      <div className="container-site grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="grid gap-12 lg:col-span-8 lg:col-start-3">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-h2">{s.h}</h2>
              <p className="mt-4 text-lead whitespace-pre-line text-ink-muted">{s.t}</p>
            </section>
          ))}
          {p.html ? <div className="prose prose-lg prose-site" dangerouslySetInnerHTML={{ __html: p.html }} /> : null}
        </div>
      </div>

      {p.gallery.length > 0 ? (
        <section aria-label="Proje görselleri" className="container-site grid gap-6 pb-20 md:grid-cols-2">
          {p.gallery.map((g, i) => (
            <Image key={i} src={g.src} alt={g.alt} width={g.width} height={g.height} sizes="(min-width: 768px) 620px, 100vw" className="w-full rounded-lg border border-line" />
          ))}
        </section>
      ) : null}

      <ProjectCta business={business} />
      <JsonLd
        data={graph({
          "@type": "CreativeWork",
          name: p.title,
          description: p.summary,
          url: absoluteUrl(`/projeler/${p.slug}/`),
          creator: { "@id": ORG_ID },
          ...(p.cover ? { image: absoluteUrl(p.cover.src) } : {}),
          dateModified: p.updatedAt,
        })}
      />
    </article>
  );
}
