import type { ReactNode } from "react";
import { AnimatedWords } from "@/components/ui/AnimatedWords";
import { Breadcrumb, type Crumb } from "@/components/ui/Breadcrumb";

/** İç sayfa başlığı: breadcrumb + H1 + giriş metni. */
export function PageHeader({ crumbs, eyebrow, title, lead, children }: { crumbs: Crumb[]; eyebrow?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <header className="under-header relative isolate overflow-hidden border-b border-line">
      <div aria-hidden className="orbs">
        <span />
        <span />
        <span />
      </div>
      <div className="container-site relative pt-8 pb-14 md:pt-10 md:pb-20">
        <Breadcrumb items={crumbs} />
        <div className="mt-12 max-w-4xl">
          {eyebrow ? (
            <p className="fade-rise eyebrow inline-flex items-center gap-2.5" style={{ "--d": 0 } as React.CSSProperties}>
              <span aria-hidden className="h-px w-6 bg-gradient-to-r from-brand to-brand-cyan" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-5 text-h1 text-balance">
            <AnimatedWords text={title} />
          </h1>
          {lead ? (
            <p className="fade-rise mt-6 max-w-[62ch] text-lead text-ink-muted" style={{ "--d": 3 } as React.CSSProperties}>
              {lead}
            </p>
          ) : null}
          {children ? (
            <div className="fade-rise" style={{ "--d": 4 } as React.CSSProperties}>
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
