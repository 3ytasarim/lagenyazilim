import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { AnimatedWords } from "@/components/ui/AnimatedWords";
import { HOME_HERO } from "@/content/home";
import { HeroVisual } from "./HeroVisual";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="under-header relative isolate overflow-hidden">
      <div aria-hidden className="orbs">
        <span />
        <span />
        <span />
      </div>
      <div className="container-site grid items-center gap-14 pt-10 pb-20 md:pt-16 md:pb-28 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <p
            className="fade-rise inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 py-1.5 pr-4 pl-2 text-sm font-medium text-ink-muted backdrop-blur"
            style={{ "--d": 0 } as React.CSSProperties}
          >
            <span className="relative flex size-6 items-center justify-center rounded-full bg-brand-tint" aria-hidden>
              <span className="pulse-dot size-2 rounded-full bg-brand" />
            </span>
            {HOME_HERO.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-7 text-display text-balance lg:text-[clamp(3rem,1rem+3.3vw,4.4rem)]">
            <AnimatedWords text={HOME_HERO.title} accent={HOME_HERO.titleAccent} />
          </h1>
          <p className="fade-rise mt-7 max-w-[54ch] text-lead text-ink-muted" style={{ "--d": 4 } as React.CSSProperties}>
            {HOME_HERO.lead}
          </p>
          <div className="fade-rise mt-10 flex flex-col gap-3 sm:flex-row" style={{ "--d": 5 } as React.CSSProperties}>
            <ButtonLink href={HOME_HERO.primary.href} size="lg" data-event="service_cta_click" data-cta="hero">
              {HOME_HERO.primary.label}
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            <ButtonLink href={HOME_HERO.secondary.href} size="lg" variant="secondary">
              {HOME_HERO.secondary.label}
            </ButtonLink>
          </div>
          <nav aria-label="Öne çıkan hizmetler" className="fade-rise mt-10" style={{ "--d": 6 } as React.CSSProperties}>
            <ul className="flex flex-wrap gap-2">
              {HOME_HERO.chips.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="group inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface/60 px-4 text-sm text-ink-muted backdrop-blur transition-[color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-brand hover:text-brand"
                  >
                    {c.label}
                    <ArrowUpRight aria-hidden className="size-3.5 opacity-50 transition-[opacity,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="lg:col-span-6">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
