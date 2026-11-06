import Link from "next/link";
import { Hash, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Sayfanın anahtar kelimelerini iki ters yönlü kayan şeritte gösteren bant (dekoratif; aynı liste
 * erişilebilir biçimde KeywordTags ile sayfada yer alır). Hareket azaltma tercihinde durağan.
 */
export function KeywordBanner({ keywords, title = "Bu sayfada öne çıkan konular" }: { keywords: string[]; title?: string }) {
  const list = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];
  if (list.length < 3) return null;
  const half = Math.ceil(list.length / 2);
  const rows = [list, [...list.slice(half), ...list.slice(0, half)]];
  return (
    <section aria-label={title} data-tone="deep" className="relative isolate overflow-hidden bg-deep py-14 text-on-deep md:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="float-a absolute -top-24 left-[10%] size-80 rounded-full bg-brand/40 blur-3xl" />
        <div className="float-b absolute -right-10 -bottom-24 size-96 rounded-full bg-brand-cyan/20 blur-3xl" />
      </div>
      <p className="container-site mb-8 flex items-center gap-2.5 text-xs font-semibold tracking-[0.16em] text-brand-cyan uppercase">
        <span aria-hidden className="h-px w-8 bg-gradient-to-r from-brand-cyan to-transparent" />
        {title}
      </p>
      <div aria-hidden className="grid gap-4">
        {rows.map((row, r) => (
          <div key={r} className={cn("marquee", r === 1 && "marquee-reverse")}>
            {[0, 1].map((k) => (
              <ul key={k}>
                {row.map((w) => (
                  <li
                    key={w}
                    className={cn(
                      "flex items-center gap-3 rounded-full border px-6 py-3 font-display text-xl font-semibold tracking-tight whitespace-nowrap md:text-2xl",
                      r === 0 ? "border-white/15 bg-white/[0.06] text-white" : "border-transparent bg-gradient-to-r from-brand/40 to-brand-cyan/25 text-white/90",
                    )}
                  >
                    <Sparkle className="size-4 text-brand-cyan" />
                    {w}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Erişilebilir etiket listesi (#etiket). `hrefFor` verilirse etiketler bağlantı olur. */
export function KeywordTags({ keywords, label = "Etiketler", hrefFor, className }: { keywords: string[]; label?: string; hrefFor?: (k: string) => string; className?: string }) {
  const list = [...new Set(keywords.map((k) => k.trim()).filter(Boolean))];
  if (!list.length) return null;
  const chip = "inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-muted transition-colors";
  return (
    <div className={className}>
      <p className="eyebrow">{label}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {list.map((k) => (
          <li key={k}>
            {hrefFor ? (
              <Link href={hrefFor(k)} className={cn(chip, "hover:border-brand hover:text-brand")}>
                <Hash aria-hidden className="size-3.5 text-brand" />
                {k}
              </Link>
            ) : (
              <span className={chip}>
                <Hash aria-hidden className="size-3.5 text-brand" />
                {k}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
