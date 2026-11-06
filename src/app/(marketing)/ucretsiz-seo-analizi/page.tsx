import { Check } from "lucide-react";
import { LeadForm } from "@/components/forms/LeadForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { FaqAccordion } from "@/components/ui/Accordion";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import type { FaqItem } from "@/types/content";

export const metadata = buildMetadata({ path: "/ucretsiz-seo-analizi/", ...PAGE_SEO.seoAudit });

const CHECKS = [
  "Sayfaların Google tarafından taranma ve indekslenme durumu",
  "Başlık, açıklama ve başlık hiyerarşisi",
  "Mobil uyum ve sayfa hızı",
  "Yönlendirme, canonical ve kopya içerik sorunları",
  "Şehir ve ilçe aramalarında yerel görünürlük",
  "Öncelikli üç-beş iyileştirme önerisi",
];

const FAQS: FaqItem[] = [
  {
    q: "Analiz otomatik bir araçla mı yapılıyor?",
    a: "Hayır. Ekibimizden bir uzman sitenizi inceler; tarama ve hız ölçüm araçlarını kullanır ama değerlendirmeyi kendisi yazar. Bu yüzden sonuç anında değil, inceleme tamamlandığında e-postayla gelir.",
  },
  {
    q: "Analiz için bir ücret ödeyecek miyim veya hizmet almak zorunda mıyım?",
    a: "Hayır. Ön analiz ücretsizdir ve herhangi bir taahhüt gerektirmez. Önerileri kendi ekibinizle de uygulayabilirsiniz.",
  },
  {
    q: "Search Console erişimi vermem gerekiyor mu?",
    a: "Ön analiz için gerekmez; herkese açık sayfalar üzerinden çalışırız. Daha ayrıntılı bir çalışma yapmaya karar verirsek erişimi ayrıca konuşuruz.",
  },
];

export default function SeoAuditPage() {
  return (
    <>
      <PageHeader
        crumbs={[
          { name: "SEO Hizmeti", path: "/ankara-seo-hizmeti/" },
          { name: "Ücretsiz SEO Analizi", path: "/ucretsiz-seo-analizi/" },
        ]}
        eyebrow="Ücretsiz"
        title="Siteniz arama motorlarında neden görünmüyor?"
        lead="Web sitenizi ve hedefinizi paylaşın; bir SEO uzmanımız sitenizi incelesin ve en çok etki yaratacak iyileştirmeleri size yazılı olarak iletsin."
      />
      <div className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-h3">Neleri inceliyoruz?</h2>
          <ul className="mt-6 grid gap-3">
            {CHECKS.map((c) => (
              <li key={c} className="flex gap-3 text-ink-muted">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-brand" strokeWidth={2.5} />
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <h2 className="mb-4 text-h3">Sık sorulanlar</h2>
            <FaqAccordion items={FAQS} />
          </div>
        </div>
        <div className="lg:col-span-7">
          <LeadForm kind="seo_audit" />
        </div>
      </div>
    </>
  );
}
