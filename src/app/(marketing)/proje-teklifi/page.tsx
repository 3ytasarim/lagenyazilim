import { Mail, MessageCircle, Phone } from "lucide-react";
import { QuoteWizard } from "@/components/forms/QuoteWizard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PAGE_SEO } from "@/content/seo";
import { QUOTE_LOCATIONS } from "@/content/provinces";
import { buildMetadata } from "@/lib/seo/metadata";
import { getBusiness, getDistricts, getQuoteOptions } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/proje-teklifi/", ...PAGE_SEO.quote });

export default async function QuotePage() {
  const [business, districts, quote] = await Promise.all([getBusiness(), getDistricts(), getQuoteOptions()]);
  const locations = QUOTE_LOCATIONS;

  return (
    <div className="container-site pt-8 pb-20 md:pt-10 md:pb-28">
      <Breadcrumb items={[{ name: "Proje Teklifi", path: "/proje-teklifi/" }]} />
      <div className="mt-10 mb-12 grid gap-8 md:mb-16 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="eyebrow">Proje teklifi</p>
          <h1 className="mt-4 text-h1">Projenizi anlatın, yol haritasıyla dönelim</h1>
          <p className="mt-5 max-w-[60ch] text-lead text-ink-muted">
            Beş kısa adımda ihtiyacınızı paylaşın. Talebinizi bir uzman inceler; gerekiyorsa kısa bir keşif görüşmesi planlar ve yazılı teklifle size döneriz.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem] text-ink-muted lg:col-span-4 lg:justify-end">
          <a href={`tel:${business.phoneE164}`} className="inline-flex items-center gap-2 hover:text-ink" data-event="phone_click">
            <Phone aria-hidden className="size-4 text-brand" /> {business.phone}
          </a>
          <a href={`https://wa.me/${business.whatsappE164}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 hover:text-ink" data-event="whatsapp_click">
            <MessageCircle aria-hidden className="size-4 text-brand" /> WhatsApp
          </a>
          <a href={`mailto:${business.email}`} className="inline-flex items-center gap-2 hover:text-ink" data-event="email_click">
            <Mail aria-hidden className="size-4 text-brand" /> {business.email}
          </a>
        </div>
      </div>
      <QuoteWizard options={quote.services} budgets={quote.budgets} locations={locations} />
    </div>
  );
}
