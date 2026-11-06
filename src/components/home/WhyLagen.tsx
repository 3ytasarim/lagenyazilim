import Image from "next/image";
import { Section, SectionHeading } from "@/components/ui/Section";
import { img } from "@/content/images";
import { WHY_LAGEN } from "@/content/home";

export function WhyLagen({ withPhoto = true }: { withPhoto?: boolean }) {
  const photo = withPhoto ? img("team-meeting") : undefined;
  return (
    <Section tone="deep" labelledBy="why-title" className="relative overflow-hidden">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="why-title"
            eyebrow="Neden Lagen?"
            title="Güzel görünen değil, işinize yarayan dijital ürünler"
            lead="Bir web sitesi ya da yazılım; ancak müşterinizin işini kolaylaştırdığında ve sizin ekibinizin kullanabildiği ölçüde değerlidir. Çalışma biçimimiz bu iki hedefe göre kurulu."
            className="mb-0 md:mb-0"
          />
          {photo ? (
            <div className="reveal relative mt-10 aspect-[4/3] overflow-hidden rounded-[20px] border border-on-deep/10" data-reveal="scale">
              <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
            </div>
          ) : null}
        </div>
        <ol className="grid gap-px overflow-hidden rounded-lg bg-on-deep/10 sm:grid-cols-2 lg:col-span-7">
          {WHY_LAGEN.map((item, i) => (
            <li key={item.title} className="reveal spotlight group bg-deep p-7 transition-colors duration-500 hover:bg-[color-mix(in_oklab,var(--deep)_88%,var(--brand))] md:p-8" style={{ "--d": i } as React.CSSProperties}>
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-brand-cyan/30 font-display text-sm text-brand-cyan tabular-nums transition-colors duration-500 group-hover:bg-brand-cyan group-hover:text-deep">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-h3">{item.title}</h3>
              <p className="mt-3 text-on-deep-muted">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
