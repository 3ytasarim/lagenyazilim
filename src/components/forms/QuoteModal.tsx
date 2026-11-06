"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { track } from "@/lib/analytics/track";
import type { QuoteServiceOption } from "@/content/quote";

// Sihirbaz (form + doğrulama kütüphaneleri) yalnızca pencere ilk açılırken yüklenir
const loadWizard = () => import("./QuoteWizard").then((m) => m.QuoteWizard);
const QuoteWizard = dynamic(loadWizard, {
  ssr: false,
  loading: () => (
    <div className="grid h-full grid-rows-[96px_1fr] md:grid-cols-[280px_1fr] md:grid-rows-1" aria-busy="true">
      <div className="bg-deep" />
      <div className="grid content-start gap-4 p-6 md:p-10">
        <div className="h-8 w-2/3 animate-pulse rounded-full bg-surface-2" />
        <div className="h-48 animate-pulse rounded-2xl bg-surface-2" />
      </div>
    </div>
  ),
});

type Props = { options: QuoteServiceOption[]; budgets: { id: string; label: string }[]; locations: string[] };

const QUOTE_PATH = "/proje-teklifi";

/**
 * "Proje teklifi" bağlantılarını açılır pencereye çevirir. JS yoksa veya yeni sekmede açılıyorsa
 * normal /proje-teklifi/ sayfasına gidilir (aşamalı geliştirme). Açılış/kapanış CSS ile animasyonlu.
 */
export function QuoteModal({ options, budgets, locations }: Props) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [preselect, setPreselect] = useState<string | null>(null);

  const close = useCallback(() => {
    const d = dialog.current;
    if (!d?.open || d.dataset.closing) return;
    const done = () => {
      delete d.dataset.closing;
      d.close();
      opener.current?.focus?.();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    d.dataset.closing = "true";
    window.setTimeout(done, 280);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.replace(/\/+$/, "") !== QUOTE_PATH) return;
      if (window.location.pathname.replace(/\/+$/, "") === QUOTE_PATH) return; // sayfanın kendisinde normal davranış
      // Yakalama aşamasında durdurulur: Next Link istemci yönlendirmesi çalışmaz
      e.preventDefault();
      e.stopPropagation();
      opener.current = a;
      setPreselect(url.searchParams.get("hizmet"));
      setMounted(true);
      dialog.current?.showModal();
      track("quote_modal_open", { cta: a.dataset.cta ?? "" });
    };
    // Bağlantıya yaklaşınca sihirbaz kodunu önceden indir
    const warm = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(`a[href^="${QUOTE_PATH}"]`);
      if (a) void loadWizard();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", warm, { passive: true });
    document.addEventListener("focusin", warm);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", warm);
      document.removeEventListener("focusin", warm);
    };
  }, []);

  // Sayfa değişirse pencere kapanır
  useEffect(() => {
    if (dialog.current?.open) dialog.current.close();
  }, [pathname]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="quote-modal-title"
      className="quote-modal m-0 mt-auto h-[94dvh] max-h-none w-full max-w-none overflow-hidden rounded-t-[28px] border border-line bg-bg p-0 text-ink shadow-float backdrop:bg-[rgb(5_8_22/0.65)] backdrop:backdrop-blur-sm md:m-auto md:h-[min(86dvh,700px)] md:w-[min(100%-3rem,1040px)] md:rounded-[28px]"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close(); // arka plana tıklama
      }}
    >
      <div className="relative h-full">
        <button
          type="button"
          onClick={close}
          aria-label="Pencereyi kapat"
          className="absolute top-4 right-4 z-20 flex size-10 items-center justify-center rounded-full border border-white/20 bg-deep/60 text-white backdrop-blur transition-[transform,background-color] duration-300 hover:rotate-90 hover:bg-white/15 md:top-5 md:right-5 md:border-line md:bg-bg/80 md:text-ink-muted md:hover:bg-surface-2 md:hover:text-ink"
        >
          <X aria-hidden className="size-5" />
        </button>
        {mounted ? (
          <QuoteWizard
            key={preselect ?? "-"}
            options={options}
            budgets={budgets}
            locations={locations}
            variant="modal"
            preselect={preselect}
            onClose={close}
            header={(
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-brand-cyan uppercase">Proje teklifi</p>
                  <h2 id="quote-modal-title" className="mt-2 font-display text-xl font-semibold tracking-tight text-white md:text-2xl">
                    Projenizi anlatın, yol haritasıyla dönelim
                  </h2>
                </div>
              )}
          />
        ) : null}
      </div>
    </dialog>
  );
}
