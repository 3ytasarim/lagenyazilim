import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import type { Region } from "@/types/content";

/** Yayımlanmış sayfası olan ilçeler bağlantı, diğerleri düz metin (boş sayfaya link verilmez). */
export function RegionDirectory({ districts, compact = false, variant = "chips" }: { districts: Region[]; compact?: boolean; variant?: "chips" | "cards" }) {
  const shown = compact ? districts.filter((d) => d.priority === 1) : districts;
  if (variant === "cards") {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((d, i) => {
          const inner = (
            <>
              <span className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-tint text-brand transition-[background-color,color,transform] duration-500 ease-out-expo group-hover:scale-110 group-hover:bg-brand group-hover:text-on-brand">
                  <MapPin aria-hidden className="size-4" />
                </span>
                {d.hasPage ? <ArrowUpRight aria-hidden className="size-4 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" /> : null}
              </span>
              <span className="mt-6 block font-display text-lg font-semibold">{d.name}</span>
              <span className="mt-1 block text-sm text-ink-soft">{d.slug === "cankaya" ? "Ofisimiz burada" : d.priority === 1 ? "Merkez ilçe" : "Ankara ilçesi"}</span>
            </>
          );
          return (
            <li key={d.slug} className="reveal" style={{ "--d": i % 5 } as React.CSSProperties}>
              {d.hasPage ? (
                <Link href={`/hizmet-bolgeleri/ankara/${d.slug}/`} className="spotlight lift group block h-full rounded-[20px] border border-line bg-surface p-5 hover:border-brand">
                  {inner}
                </Link>
              ) : (
                <div className="block h-full rounded-[20px] border border-line bg-surface/60 p-5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {shown.map((d) =>
          d.hasPage ? (
            <li key={d.slug}>
              <Link
                href={`/hizmet-bolgeleri/ankara/${d.slug}/`}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium transition-colors hover:border-brand hover:text-brand"
              >
                {d.name}
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </li>
          ) : (
            <li
              key={d.slug}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface/60 px-4 text-[0.9375rem] text-ink-muted"
            >
              {d.slug === "cankaya" ? <MapPin aria-hidden className="size-3.5 text-brand" /> : null}
              {d.name}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
