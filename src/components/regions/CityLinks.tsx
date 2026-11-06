import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { getCities } from "@/server/queries/content";

/**
 * Yayındaki il sayfaları + Ankara (ofis) bağlantıları. Yalnızca yayımlanmış sayfalara bağlantı verilir.
 * `variant="cards"`: hub sayfası için kart ızgarası.
 */
export async function CityLinks({ variant = "chips" }: { variant?: "chips" | "cards" }) {
  const cities = await getCities();
  const all = [{ slug: "ankara", name: "Ankara", note: "Ofisimiz burada · 25 ilçe" }, ...cities.map((c) => ({ ...c, note: "Çevrim içi süreç" }))];
  const href = (slug: string) => `/hizmet-bolgeleri/${slug}/`;

  if (variant === "cards") {
    return (
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {all.map((c, i) => (
          <li key={c.slug} className="reveal" style={{ "--d": i % 4 } as React.CSSProperties}>
            <Link href={href(c.slug)} className="spotlight lift group block h-full rounded-[20px] border border-line bg-surface p-5 hover:border-brand">
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand-tint text-brand transition-[background-color,color,transform] duration-500 ease-out-expo group-hover:scale-110 group-hover:bg-brand group-hover:text-on-brand">
                  <MapPin aria-hidden className="size-4" />
                </span>
                <ArrowRight aria-hidden className="size-4 text-ink-soft transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand" />
              </span>
              <span className="mt-6 block font-display text-xl font-semibold">{c.name}</span>
              <span className="mt-1 block text-sm text-ink-soft">{c.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {all.map((c) => (
        <li key={c.slug}>
          <Link
            href={href(c.slug)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-[0.9375rem] font-medium transition-colors hover:border-brand hover:text-brand"
          >
            {c.slug === "ankara" ? <MapPin aria-hidden className="size-3.5 text-brand" /> : null}
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
