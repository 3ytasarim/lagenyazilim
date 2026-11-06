import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "alt" | "deep";

const tones: Record<Tone, string> = {
  default: "bg-bg text-ink",
  alt: "bg-surface-2/60 text-ink",
  deep: "bg-deep text-on-deep",
};

export function Section({
  id,
  tone = "default",
  className,
  children,
  labelledBy,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} data-tone={tone} className={cn("py-20 md:py-28", tones[tone], className)}>
      <div className="container-site">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = "start",
  as: Tag = "h2",
  className,
  action,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "start" | "center";
  as?: "h1" | "h2";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 md:mb-16",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className={cn("reveal max-w-3xl", align === "center" && "mx-auto")} data-reveal="blur">
        {eyebrow ? (
          <p className="eyebrow mb-4 inline-flex items-center gap-2.5 in-data-[tone=deep]:text-on-deep-muted">
            <span aria-hidden className="h-px w-6 bg-gradient-to-r from-brand to-brand-cyan" />
            {eyebrow}
          </p>
        ) : null}
        <Tag id={id} className={Tag === "h1" ? "text-h1" : "text-h2"}>
          {title}
        </Tag>
        {lead ? <p className="mt-5 max-w-[60ch] text-lead text-ink-muted in-data-[tone=deep]:text-on-deep-muted">{lead}</p> : null}
      </div>
      {action ? <div className="reveal shrink-0" style={{ "--d": 2 } as React.CSSProperties}>{action}</div> : null}
    </div>
  );
}
