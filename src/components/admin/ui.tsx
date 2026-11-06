import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPage({
  title,
  description,
  crumbs,
  actions,
  children,
}: {
  title: string;
  description?: string;
  crumbs?: { href: string; label: string }[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main id="icerik" className="px-4 py-8 md:px-8 lg:px-10">
      {crumbs?.length ? (
        <nav aria-label="Konum" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-ink-soft">
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-ink">
                {c.label}
              </Link>
              <ChevronRight aria-hidden className="size-3.5" />
            </span>
          ))}
        </nav>
      ) : null}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </main>
  );
}

export function Card({ title, description, children, className, actions }: { title?: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("min-w-0 rounded-lg border border-line bg-surface", className)}>
      {title ? (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Taslak", cls: "bg-surface-2 text-ink-muted" },
  review: { label: "İncelemede", cls: "bg-warning/15 text-warning" },
  published: { label: "Yayında", cls: "bg-success/15 text-success" },
  scheduled: { label: "Zamanlandı", cls: "bg-brand-tint text-brand" },
  archived: { label: "Arşiv", cls: "bg-surface-2 text-ink-soft" },
};

export function StatusBadge({ status, publishedAt }: { status: string; publishedAt?: Date | null }) {
  const key = status === "published" && publishedAt && publishedAt > new Date() ? "scheduled" : status;
  const s = STATUS[key] ?? { label: status, cls: "bg-surface-2 text-ink-muted" };
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold", s.cls)}>{s.label}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[640px] text-left text-[0.9375rem]">
        <thead className="border-b border-line bg-surface-2/50 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function EmptyRow({ text, cols }: { text: string; cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-ink-muted">
        {text}
      </td>
    </tr>
  );
}

export function fmtDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(d);
}
