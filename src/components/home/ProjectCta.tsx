import { ArrowRight, Mail, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { PROJECT_CTA } from "@/content/home";
import type { BusinessInfo } from "@/lib/site";

export function ProjectCta({ business, title = PROJECT_CTA.title, text = PROJECT_CTA.text, href = "/proje-teklifi/" }: { business: BusinessInfo; title?: string; text?: string; href?: string }) {
  return (
    <section aria-labelledby="cta-title" className="py-20 md:py-28">
      <div className="container-site">
        <div data-tone="deep" data-reveal="scale" className="reveal ring-gradient relative isolate overflow-hidden rounded-[28px] bg-deep px-6 py-14 text-on-deep md:px-16 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="float-a absolute -top-24 -left-16 size-80 rounded-full bg-brand/40 blur-3xl" />
            <div className="float-b absolute -right-10 -bottom-28 size-96 rounded-full bg-brand-cyan/25 blur-3xl" />
          </div>
          <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-16 -bottom-24 size-[420px] text-brand-cyan/15">
            <path d="M100 10 178 55v90l-78 45-78-45V55z" fill="none" stroke="currentColor" strokeWidth=".8" />
            <path d="M100 40 152 70v60l-52 30-52-30V70z" fill="none" stroke="currentColor" strokeWidth=".8" />
          </svg>
          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h2 id="cta-title" className="text-h1">
                {title}
              </h2>
              <p className="mt-5 max-w-[56ch] text-lead text-on-deep-muted">{text}</p>
            </div>
            <div className="flex flex-col gap-4 lg:col-span-4 lg:items-end">
              <ButtonLink href={href} variant="inverse" size="lg" data-event="service_cta_click" data-cta="project-cta">
                Proje Teklifi Al <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
              <div className="flex flex-col gap-2 text-[0.9375rem] text-on-deep-muted lg:items-end">
                <a href={`tel:${business.phoneE164}`} className="inline-flex items-center gap-2 hover:text-on-deep" data-event="phone_click">
                  <Phone aria-hidden className="size-4" /> {business.phone}
                </a>
                <a href={`mailto:${business.email}`} className="inline-flex items-center gap-2 hover:text-on-deep" data-event="email_click">
                  <Mail aria-hidden className="size-4" /> {business.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
