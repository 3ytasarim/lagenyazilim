import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, graph } from "@/lib/seo/schema";

export type Crumb = { name: string; path: string };

/** Görünür breadcrumb + aynı verinin BreadcrumbList şeması. İlk öğe her zaman Ana Sayfa. */
export function Breadcrumb({ items, tone = "default" }: { items: Crumb[]; tone?: "default" | "deep" }) {
  const all = [{ name: "Ana Sayfa", path: "/" }, ...items];
  const muted = tone === "deep" ? "text-on-deep-muted hover:text-on-deep" : "text-ink-soft hover:text-ink";
  return (
    <>
      <nav aria-label="Sayfa konumu" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className={tone === "deep" ? "text-on-deep" : "text-ink"}>
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className={`transition-colors ${muted}`}>
                      {c.name}
                    </Link>
                    <ChevronRight aria-hidden className="size-3.5 opacity-50" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={graph(breadcrumbSchema(all))} />
    </>
  );
}
