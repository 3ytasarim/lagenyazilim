import { Building2, Globe2, Video } from "lucide-react";
import { ProjectCta } from "@/components/home/ProjectCta";
import { PageHeader } from "@/components/layout/PageHeader";
import { CityLinks } from "@/components/regions/CityLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { graph, professionalServiceSchema } from "@/lib/seo/schema";
import { getBusiness, getCities } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/hizmet-bolgeleri/", ...PAGE_SEO.regions });

const MODEL = [
  { icon: Globe2, title: "Türkiye geneli", text: "Keşiften yayına kadar tüm süreç çevrim içi yürütülebilir; şehriniz fark etmez." },
  { icon: Video, title: "Çevrim içi toplantı", text: "Görüntülü görüşme, paylaşılan belgeler ve panel üzerinden onaylarla ilerliyoruz." },
  { icon: Building2, title: "Ankara ofisi", text: "Ankara'da ofisimizde veya işyerinizde yüz yüze; diğer illerde gerektiğinde ziyaret planlanabilir." },
];

export default async function RegionsIndexPage() {
  const [business, cities] = await Promise.all([getBusiness(), getCities()]);
  return (
    <>
      <PageHeader
        crumbs={[{ name: "Hizmet Bölgeleri", path: "/hizmet-bolgeleri/" }]}
        eyebrow="Hizmet bölgeleri"
        title="Türkiye'nin her yerindeki işletmelerle çalışıyoruz"
        lead="Ofisimiz Ankara Çankaya'da. Diğer illerdeki işletmelerle süreci çevrim içi yürütüyor, gerektiğinde yüz yüze görüşme planlıyoruz. Şehrinizin iş yapısına göre hazırladığımız sayfaları inceleyin."
      />

      <Section labelledBy="model-title">
        <SectionHeading id="model-title" eyebrow="Çalışma düzeni" title="Bulunduğunuz şehir fark etmez" />
        <ul className="grid gap-4 md:grid-cols-3">
          {MODEL.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="reveal" style={{ "--d": i } as React.CSSProperties}>
              <div className="spotlight lift h-full rounded-[20px] border border-line bg-surface p-7">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-cyan text-white">
                  <Icon aria-hidden className="size-6" />
                </span>
                <h3 className="mt-5 text-h3">{title}</h3>
                <p className="mt-2 text-ink-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="cities-title" tone="alt">
        <SectionHeading
          id="cities-title"
          eyebrow="Şehirler"
          title="Şehrinize özel sayfalar"
          lead="Her sayfada o şehrin ekonomik yapısını ve işletmelerin dijital ihtiyaçlarını kaynaklarıyla anlattık. Ankara sayfasında 25 ilçenin her biri için ayrı sayfa bulunur."
        />
        <CityLinks variant="cards" />
        <p className="mt-8 text-ink-muted">Listede şehriniz yoksa da sorun değil: Türkiye&apos;nin tüm illerindeki işletmelerle aynı düzende çalışıyoruz.</p>
      </Section>

      <ProjectCta business={business} />
      <JsonLd data={graph(professionalServiceSchema(business, ["Türkiye", "Ankara", ...cities.map((c) => c.name)]))} />
    </>
  );
}
