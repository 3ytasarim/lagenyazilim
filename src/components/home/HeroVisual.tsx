"use client";

import { useEffect, useState } from "react";
import { Check, Rocket, Search } from "lucide-react";

type Tok = [cls: string, text: string];

/** Kod satırları ve her satırın önizlemede "kurduğu" blok aynı sırayla (--i) canlanır. */
const CODE: Tok[][] = [
  [["text-[#c792ea]", "<Site "], ["text-[#82aaff]", "marka"], ["text-[#89ddff]", "="], ["text-[#c3e88d]", '"Firmanız"'], ["text-[#c792ea]", ">"]],
  [["text-[#c792ea]", "  <Menü "], ["text-[#82aaff]", "sabit"], ["text-[#c792ea]", " />"]],
  [["text-[#c792ea]", "  <Hero "], ["text-[#82aaff]", "başlık"], ["text-[#89ddff]", "="], ["text-[#c3e88d]", "{teklif}"], ["text-[#c792ea]", " />"]],
  [["text-[#c792ea]", "  <Hizmetler "], ["text-[#82aaff]", "kaynak"], ["text-[#89ddff]", "="], ["text-[#c3e88d]", "{panel}"], ["text-[#c792ea]", " />"]],
  [["text-[#c792ea]", "  <TeklifFormu "], ["text-[#82aaff]", "adım"], ["text-[#89ddff]", "="], ["text-[#f78c6c]", "{5}"], ["text-[#c792ea]", " />"]],
  [["text-[#c792ea]", "  <SEO "], ["text-[#82aaff]", "şema"], ["text-[#89ddff]", "="], ["text-[#c3e88d]", '"LocalBusiness"'], ["text-[#c792ea]", " />"]],
  [["text-[#c792ea]", "</Site>"]],
];

const CHECKS = ["Mobil uyum", "Şema işaretleme", "Erişilebilirlik"];

/**
 * Hero görseli: solda yazılan kod, sağda aynı anda kurulan site önizlemesi.
 * Tamamen dekoratif (aria-hidden); sahne ~12 sn'de bir baştan oynar. Hareket azaltma tercihinde durağan.
 */
export function HeroVisual() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => {
      if (!document.hidden) setCycle((c) => c + 1);
    }, 12000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[600px] select-none lg:max-w-none">
      <div key={cycle} className="relative aspect-[6/5]">
        {/* Kod editörü */}
        <div className="absolute top-0 left-0 w-[64%] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1230] shadow-float">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-3 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/60">site.tsx</span>
          </div>
          <div className="px-4 py-4 font-mono text-[10.5px] leading-[1.9] sm:text-[12px]">
            {CODE.map((line, i) => (
              <div key={i} className="flex gap-3">
                <span className="w-4 shrink-0 text-right text-white/25">{i + 1}</span>
                <span className="code-line" style={{ "--i": i } as React.CSSProperties}>
                  {line.map(([cls, t], j) => (
                    <span key={j} className={cls}>
                      {t}
                    </span>
                  ))}
                </span>
              </div>
            ))}
            <div className="flex gap-3">
              <span className="w-4 shrink-0 text-right text-white/25">{CODE.length + 1}</span>
              <span className="caret inline-block h-[1.2em] w-[7px] translate-y-[3px] bg-[#5fd0ff]" />
            </div>
          </div>
        </div>

        {/* Site önizlemesi */}
        <div className="glass-card absolute top-[14%] right-0 w-[60%] overflow-hidden rounded-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="size-2 rounded-full bg-line-strong" />
            <span className="ml-1 h-5 flex-1 truncate rounded-full bg-surface-2 px-2.5 text-[10px] leading-5 text-ink-muted">firmaniz.com.tr</span>
          </div>
          <div className="grid gap-2.5 p-3">
            <div className="build-in flex items-center justify-between" style={{ "--i": 1 } as React.CSSProperties}>
              <span className="h-2.5 w-12 rounded-full bg-ink/80" />
              <span className="flex gap-1.5">
                <span className="h-1.5 w-6 rounded-full bg-line-strong" />
                <span className="h-1.5 w-6 rounded-full bg-line-strong" />
                <span className="h-1.5 w-9 rounded-full bg-brand" />
              </span>
            </div>
            <div className="build-in relative overflow-hidden rounded-lg bg-gradient-to-br from-brand to-brand-cyan p-3" style={{ "--i": 2 } as React.CSSProperties}>
              <span className="block h-2.5 w-[70%] rounded bg-white/90" />
              <span className="mt-1.5 block h-2.5 w-[50%] rounded bg-white/90" />
              <span className="mt-3 inline-block h-4 w-14 rounded-full bg-white" />
            </div>
            <div className="build-in grid grid-cols-3 gap-1.5" style={{ "--i": 3 } as React.CSSProperties}>
              {[0, 1, 2].map((k) => (
                <span key={k} className="rounded-md border border-line bg-surface p-1.5">
                  <span className="block size-3 rounded bg-brand-tint" />
                  <span className="mt-1.5 block h-1 w-[80%] rounded-full bg-ink/50" />
                  <span className="mt-1 block h-1 w-full rounded-full bg-line" />
                </span>
              ))}
            </div>
            <div className="build-in rounded-md border border-line bg-surface p-2" style={{ "--i": 4 } as React.CSSProperties}>
              <span className="flex gap-1">
                {[0, 1, 2, 3, 4].map((k) => (
                  <span key={k} className={k < 2 ? "h-1 flex-1 rounded-full bg-brand" : "h-1 flex-1 rounded-full bg-line"} />
                ))}
              </span>
              <span className="mt-2 block h-3 w-full rounded bg-surface-2" />
              <span className="mt-1.5 flex justify-end">
                <span className="h-3 w-10 rounded-full bg-brand" />
              </span>
            </div>
          </div>
        </div>

        {/* Arama sonucu */}
        <div className="build-in absolute bottom-[4%] left-[2%] w-[52%]" style={{ "--i": 5 } as React.CSSProperties}>
          <div className="glass-card float-a rounded-2xl p-3.5">
            <div className="flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] text-ink-muted">
              <Search className="size-3.5" />
              ankara web tasarım
            </div>
            <p className="mt-2.5 text-[10px] text-ink-muted">firmaniz.com.tr › hizmetler</p>
            <p className="mt-0.5 text-[12px] leading-snug font-semibold text-brand">Kurumsal Web Tasarım | Firmanız</p>
            <span className="mt-2 block h-1 w-full rounded-full bg-line" />
            <span className="mt-1 block h-1 w-[70%] rounded-full bg-line" />
          </div>
        </div>

        {/* Kontrol listesi + yayın bildirimi */}
        <div className="build-in absolute right-[3%] bottom-0 w-[42%]" style={{ "--i": 6 } as React.CSSProperties}>
          <div className="glass-card float-b rounded-2xl p-3.5">
            <ul className="grid gap-1.5">
              {CHECKS.map((c) => (
                <li key={c} className="flex items-center gap-2 text-[11.5px] font-medium text-ink">
                  <span className="flex size-4 items-center justify-center rounded-full bg-brand text-on-brand">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-tint px-2.5 py-2 text-[11px] font-semibold text-brand">
              <Rocket className="size-3.5" />
              Yayına alındı
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
