import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import type { BusinessInfo } from "@/lib/site";
import type { Service } from "@/types/content";
import { BrandMarquee } from "./BrandMarquee";
import { ConsentReopenButton } from "./ConsentAndAnalytics";
import { Logo } from "./Logo";
import type { NavItem } from "./nav";

type Props = { business: BusinessInfo; services: Service[]; cities: { slug: string; name: string }[]; nav: NavItem[] };

const LEGAL = [
  { label: "KVKK Aydınlatma Metni", href: "/kvkk-aydinlatma-metni/" },
  { label: "Gizlilik Politikası", href: "/gizlilik-politikasi/" },
  { label: "Çerez Politikası", href: "/cerez-politikasi/" },
];

const heading = "text-[11px] font-bold tracking-[0.16em] text-ink-soft uppercase";
const link = "font-medium text-ink-muted transition-colors duration-300 hover:text-brand";

/**
 * Footer (efferd/footer-section düzeni, Bleibsichtbar yeni tasarımından uyarlandı): üstü yuvarlatılmış kart,
 * üst kenarda ortada ışıyan çizgi, solda marka cümlesi, sağda bağlantı sütunları. Bloklar görünüme girince sırayla netleşir.
 */
export function SiteFooter({ business, services, cities, nav }: Props) {
  const year = new Date().getFullYear();
  const regionLinks = [{ slug: "ankara", name: "Ankara" }, ...cities];
  return (
    <footer className="relative mt-8 w-full overflow-hidden rounded-t-[2.5rem] border-t border-line bg-[radial-gradient(40%_220px_at_50%_0%,color-mix(in_oklab,var(--brand)_16%,transparent),transparent)]">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-px w-1/3 -translate-x-1/2 rounded-full bg-brand/70 blur-[2px]" />
      {/* Üst çerçeve: kayan marka şeridi */}
      <div className="border-b border-line">
        <BrandMarquee />
      </div>
      <div className="container-site flex flex-col py-12 lg:py-16">

        <div className="grid w-full gap-12 xl:grid-cols-3 xl:gap-10">
          <div className="reveal space-y-6" data-reveal="blur">
            <Logo />
            <p className="font-display text-[clamp(1.4rem,2.4vw,1.85rem)] leading-[1.12] font-bold tracking-tight text-ink uppercase">
              Türkiye genelinde
              <br />
              işinizi büyüten
              <br />
              <span className="text-gradient">web ve yazılım</span> çözümleri
            </p>
            <address className="grid gap-2.5 text-sm not-italic">
              <span className="flex gap-2.5 text-ink-muted">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  <span className="block">
                    {business.address.neighborhood}, {business.address.street}
                  </span>
                  <span className="block">
                    {business.address.district} / {business.address.city}
                  </span>
                </span>
              </span>
              <a href={`tel:${business.phoneE164}`} className={`flex gap-2.5 ${link}`} data-event="phone_click">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
                {business.phone}
              </a>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-3 xl:col-span-2">
            <nav aria-label="Hizmetler" className="reveal" data-reveal="blur" style={{ "--d": 1 } as React.CSSProperties}>
              <p className={heading}>Hizmetler</p>
              <ul className="mt-5 space-y-3 text-sm">
                {services.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}/`} className={link}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Kurumsal" className="reveal" data-reveal="blur" style={{ "--d": 2 } as React.CSSProperties}>
              <p className={heading}>Kurumsal</p>
              <ul className="mt-5 space-y-3 text-sm">
                {nav
                  .filter((n) => !n.mega)
                  .map((n) => (
                    <li key={n.href}>
                      <Link href={n.href} className={link}>
                        {n.label}
                      </Link>
                    </li>
                  ))}
                <li>
                  <Link href="/ucretsiz-seo-analizi/" className={link}>
                    Ücretsiz SEO Analizi
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="reveal col-span-2 md:col-span-1" data-reveal="blur" style={{ "--d": 3 } as React.CSSProperties}>
              <p className={heading}>İletişim</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li>
                  <a href={`mailto:${business.email}`} className={`flex items-center gap-2 ${link}`} data-event="email_click">
                    <Mail aria-hidden className="size-3.5 shrink-0 text-brand" />
                    {business.email}
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/${business.whatsappE164}`} target="_blank" rel="noopener" className={`flex items-center gap-2 ${link}`} data-event="whatsapp_click">
                    <WhatsAppIcon className="size-3.5 shrink-0 text-[var(--wa)]" />
                    WhatsApp ile yazın
                  </a>
                </li>
                <li>
                  <Link href="/proje-teklifi/" className={`flex items-center gap-2 ${link}`} data-event="service_cta_click" data-cta="footer">
                    <span aria-hidden className="w-3.5 shrink-0 text-center text-brand">
                      ✦
                    </span>
                    Ücretsiz teklif alın
                  </Link>
                </li>
                {business.social.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} target="_blank" rel="noopener me" className={`flex items-center gap-2 ${link}`} data-event="outbound_click">
                      <span aria-hidden className="w-3.5 shrink-0 text-center text-brand">
                        ↗
                      </span>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              {regionLinks.length > 0 ? (
                <>
                  <p className={`${heading} mt-8`}>Hizmet bölgeleri</p>
                  <p className="mt-4 text-sm leading-relaxed">
                    {regionLinks.map((d, i) => (
                      <span key={d.slug}>
                        <Link href={`/hizmet-bolgeleri/${d.slug}/`} className={link}>
                          {d.name}
                        </Link>
                        {i < regionLinks.length - 1 ? <span className="text-ink-soft"> · </span> : null}
                      </span>
                    ))}
                  </p>
                  <Link href="/hizmet-bolgeleri/" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                    Tüm hizmet bölgeleri
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs tracking-wide text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {business.legalName ?? business.name}. Tüm hakları saklıdır.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-ink">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <ConsentReopenButton className="transition-colors hover:text-ink" />
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
