import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { ProjectCta } from "@/components/home/ProjectCta";
import Image from "next/image";
import { PageHeader } from "@/components/layout/PageHeader";
import { img, type ImageKey } from "@/content/images";

const SOLUTION_IMAGE: Record<string, ImageKey> = { sanayi: "industry", hizmet: "office-services", bayi: "logistics", "yeni-marka": "startup" };
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { SOLUTIONS } from "@/content/solutions";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getServices } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/cozumler/", ...PAGE_SEO.solutions });

export default async function SolutionsPage() {
  const [services, business] = await Promise.all([getServices(), getBusiness()]);
  const bySlug = new Map(services.map((s) => [s.slug, s]));

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Çözümler", path: "/cozumler/" }]}
        eyebrow="Çözümler"
        title="İşinizin ihtiyacına göre birleşen hizmetler"
        lead="Her işletmenin dijitalde çözmesi gereken sorun farklı. Aşağıda en sık çalıştığımız işletme türlerini, karşılaştıkları ihtiyaçları ve bu ihtiyaçlar için hangi hizmetleri birlikte planladığımızı bulabilirsiniz."
      >
        <nav aria-label="Çözüm başlıkları" className="mt-10 flex flex-wrap gap-2">
          {SOLUTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
              {s.title}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="container-site divide-y divide-line py-8 md:py-12">
        {SOLUTIONS.map((sol, i) => {
          const key = SOLUTION_IMAGE[sol.id];
          const photo = key ? img(key) : undefined;
          return (
          <section key={sol.id} id={sol.id} aria-labelledby={`${sol.id}-h`} className="reveal grid gap-10 py-14 md:py-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <span className="font-display text-sm text-ink-soft tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <h2 id={`${sol.id}-h`} className="mt-4 text-h2">
                {sol.title}
              </h2>
              <p className="mt-4 text-ink-muted">{sol.who}</p>
              {photo ? (
                <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-[20px] border border-line bg-surface-2">
                  <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
                </div>
              ) : null}
            </div>
            <div className="grid gap-10 md:grid-cols-2 lg:col-span-7">
              <div>
                <h3 className="eyebrow">Sık görülen ihtiyaçlar</h3>
                <ul className="mt-5 grid gap-3">
                  {sol.needs.map((n) => (
                    <li key={n} className="flex gap-3 text-ink-muted">
                      <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" strokeWidth={2.5} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="eyebrow">Birlikte planladığımız hizmetler</h3>
                <ul className="mt-5 grid gap-2">
                  {sol.services.map((slug) => {
                    const s = bySlug.get(slug);
                    if (!s) return null;
                    return (
                      <li key={slug}>
                        <Link href={`/${slug}/`} className="group flex items-center gap-3 rounded-md border border-line bg-surface p-3.5 hover:border-brand">
                          <ServiceIcon name={s.icon} className="size-5 text-brand" />
                          <span className="flex-1 font-medium">{s.name}</span>
                          <ArrowUpRight aria-hidden className="size-4 text-ink-soft group-hover:text-brand" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
          );
        })}
      </div>

      <ProjectCta business={business} />
    </>
  );
}
