import { Building2, MapPin, Video } from "lucide-react";
import { ProjectCta } from "@/components/home/ProjectCta";
import { RegionDirectory } from "@/components/home/RegionDirectory";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { ServicesGrid } from "@/components/services/ServicesGrid";
import { FaqAccordion } from "@/components/ui/Accordion";
import { Section, SectionHeading } from "@/components/ui/Section";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqSchema, graph, professionalServiceSchema } from "@/lib/seo/schema";
import { formatAddress } from "@/lib/site";
import { getBusiness, getDistricts, getServices } from "@/server/queries/content";
import type { FaqItem } from "@/types/content";

export const metadata = buildMetadata({ path: "/hizmet-bolgeleri/ankara/", ...PAGE_SEO.ankara });

const MODEL = [
  { icon: Building2, title: "Ofisimizde", text: "Keşif ve tasarım sunumları için Çankaya'daki ofisimizde buluşabiliriz." },
  { icon: MapPin, title: "İşyerinizde", text: "Süreç analizi ve keşif toplantıları için işyerinize geliyoruz." },
  { icon: Video, title: "Çevrim içi", text: "Ara toplantılar, onaylar ve eğitimler görüntülü görüşmeyle yapılabilir." },
];

const FAQS: FaqItem[] = [
  {
    q: "Çalışmak için ofisinize gelmem gerekir mi?",
    a: "Hayır. Toplantıları ofisimizde, işyerinizde ya da çevrim içi yapabiliyoruz. Projenin çoğu aşaması uzaktan yürütülebilir; yerinde bulunmayı gerektiren işler süreç analizi gibi işlerdir.",
  },
  {
    q: "Ankara'nın merkez dışı ilçelerinde de çalışıyor musunuz?",
    a: "Evet. Projenin büyük kısmı çevrim içi yürütülebildiği için merkeze uzak ilçelerdeki işletmelerle de çalışabiliyoruz. Yerinde ziyaret gereken işlerde ulaşım planı teklif aşamasında konuşulur.",
  },
  {
    q: "Başka ilçelerde şubeniz var mı?",
    a: "Hayır, tek ofisimiz Çankaya'dadır. Diğer ilçelerdeki işletmelere bu ofisten ve yerinde ziyaretlerle hizmet veriyoruz.",
  },
];

export default async function AnkaraPage() {
  const [business, districts, services] = await Promise.all([getBusiness(), getDistricts(), getServices()]);
  const primary = districts.filter((d) => d.priority === 1);
  const others = districts.filter((d) => d.priority !== 1);

  return (
    <>
      <PageHeader
        crumbs={[
          { name: "Hizmet Bölgeleri", path: "/hizmet-bolgeleri/" },
          { name: "Ankara", path: "/hizmet-bolgeleri/ankara/" },
        ]}
        eyebrow="Ankara"
        title="Ankara'daki işletmeler için web, yazılım ve dijital pazarlama"
        lead="Çankaya'daki ofisimizden Ankara'nın 25 ilçesindeki işletmelerle çalışıyoruz. Şube açmak yerine yerinde ziyaret ve çevrim içi toplantıyı birleştiren bir çalışma düzeni kullanıyoruz."
      />

      <Section labelledBy="model-title">
        <SectionHeading id="model-title" eyebrow="Çalışma düzeni" title="Bölgenize nasıl hizmet veriyoruz?" />
        <ul className="grid gap-4 md:grid-cols-3">
          {MODEL.map(({ icon: Icon, title, text }) => (
            <li key={title} className="spotlight lift rounded-[20px] border border-line bg-surface p-7">
              <Icon aria-hidden strokeWidth={1.6} className="size-6 text-brand" />
              <h3 className="mt-5 text-h3">{title}</h3>
              <p className="mt-2 text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 flex gap-3 text-ink-muted">
          <MapPin aria-hidden className="mt-1 size-4 shrink-0 text-brand" />
          Ofis: {formatAddress(business)}
        </p>
      </Section>

      <Section labelledBy="districts-title" tone="alt">
        <SectionHeading
          id="districts-title"
          eyebrow="İlçeler"
          title="Hizmet verdiğimiz ilçeler"
          lead="Her ilçenin iş yapısını ve işletmelerin dijital ihtiyaçlarını ayrı sayfada anlattık. İlçenizi seçin."
        />
        <h3 className="mb-5 font-semibold">Merkez ilçeler</h3>
        <RegionDirectory districts={primary} variant="cards" />
        <h3 className="mt-12 mb-5 font-semibold">Diğer ilçeler</h3>
        <RegionDirectory districts={others} variant="cards" />
      </Section>

      <Section labelledBy="ankara-services-title">
        <SectionHeading id="ankara-services-title" eyebrow="Hizmetler" title="Ankara'da sunduğumuz hizmetler" />
        <ServicesGrid services={services} />
      </Section>

      <Section labelledBy="ankara-faq-title" tone="alt">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="ankara-faq-title" className="text-h2">
              Sık sorulan sorular
            </h2>
          </div>
          <div className="lg:col-span-8">
            <FaqAccordion items={FAQS} />
          </div>
        </div>
      </Section>

      <ProjectCta business={business} />
      <JsonLd data={graph(professionalServiceSchema(business, ["Ankara", ...districts.map((d) => d.name)]), faqSchema(FAQS))} />
    </>
  );
}
