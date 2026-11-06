import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { LeadForm } from "@/components/forms/LeadForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { graph, professionalServiceSchema } from "@/lib/seo/schema";
import { formatAddress } from "@/lib/site";
import { getBusiness } from "@/server/queries/content";

export const metadata = buildMetadata({ path: "/iletisim/", ...PAGE_SEO.contact });

export default async function ContactPage() {
  const business = await getBusiness();
  const channels = [
    { icon: Phone, label: "Telefon", value: business.phone, href: `tel:${business.phoneE164}`, event: "phone_click" },
    { icon: MessageCircle, label: "WhatsApp", value: business.phone, href: `https://wa.me/${business.whatsappE164}`, event: "whatsapp_click", external: true },
    { icon: Mail, label: "E-posta", value: business.email, href: `mailto:${business.email}`, event: "email_click" },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ name: "İletişim", path: "/iletisim/" }]}
        eyebrow="İletişim"
        title="Bize ulaşın"
        lead="Sorunuzu yazın ya da doğrudan arayın. Proje fiyatlandırması için teklif formunu kullanırsanız ihtiyacınızı daha hızlı değerlendirebiliriz."
      />
      <div className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ul className="grid gap-3">
            {channels.map(({ icon: Icon, label, value, href, event, external }) => (
              <li key={label}>
                <a
                  href={href}
                  data-event={event}
                  {...(external ? { target: "_blank", rel: "noopener" } : {})}
                  className="flex items-center gap-4 spotlight lift rounded-[20px] border border-line bg-surface p-5 transition-colors hover:border-brand"
                >
                  <span className="flex size-11 items-center justify-center rounded-md bg-brand-tint text-brand">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm text-ink-soft">{label}</span>
                    <span className="block font-semibold">{value}</span>
                  </span>
                </a>
              </li>
            ))}
            <li className="flex items-start gap-4 spotlight lift rounded-[20px] border border-line bg-surface p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
                <MapPin aria-hidden className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-ink-soft">Ofis</span>
                <address className="not-italic font-semibold">{formatAddress(business)}</address>
                {business.openingHours ? <span className="mt-1 block text-sm text-ink-muted">{business.openingHours}</span> : null}
              </span>
            </li>
          </ul>
          <Link href="/proje-teklifi/" className="mt-8 flex items-center justify-between rounded-lg bg-deep p-6 text-on-deep" data-event="service_cta_click" data-cta="contact">
            <span>
              <span className="block text-h3">Proje teklifi mi istiyorsunuz?</span>
              <span className="mt-1 block text-sm text-on-deep-muted">5 adımlı formla ihtiyacınızı ayrıntılı anlatın.</span>
            </span>
            <ArrowRight aria-hidden className="size-5 shrink-0" />
          </Link>
        </div>
        <div className="lg:col-span-7">
          <h2 className="mb-6 text-h3">Mesaj bırakın</h2>
          <LeadForm kind="contact" />
        </div>
      </div>
      <JsonLd data={graph(professionalServiceSchema(business, ["Türkiye", "Ankara"]))} />
    </>
  );
}
