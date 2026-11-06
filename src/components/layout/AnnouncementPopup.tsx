"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

export type ActivePopup = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  linkUrl: string | null;
  linkLabel: string | null;
  startsAt: string;
  endsAt: string;
  delayMs: number;
};

/** Teklif/form sayfalarında ve teklif penceresi açıkken gösterilmez. */
const HIDDEN_ON = ["/proje-teklifi", "/ucretsiz-seo-analizi", "/iletisim"];
const seenKey = (id: string) => `lagen-popup-${id}`;

/**
 * Admin › Duyurular'dan yönetilen açılır pencere. Tarih aralığı sunucuda ve burada (saat bazında) kontrol edilir;
 * ziyaretçi kapattıktan sonra aynı duyuru o tarayıcıda tekrar açılmaz. Gecikmeli açılır (LCP'yi etkilemez).
 */
export function AnnouncementPopup({ popup }: { popup: ActivePopup | null }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!popup) return;
    const now = Date.now();
    if (now < Date.parse(popup.startsAt) || now >= Date.parse(popup.endsAt)) return;
    if (HIDDEN_ON.includes(pathname.replace(/\/+$/, ""))) return;
    try {
      if (localStorage.getItem(seenKey(popup.id))) return;
    } catch {
      /* depolama kapalıysa her ziyarette gösterilebilir — sorun değil */
    }
    const t = window.setTimeout(() => {
      if (document.querySelector("dialog[open]")) return; // başka bir pencere açıksa üstüne açılmaz
      setMounted(true);
      requestAnimationFrame(() => dialog.current?.showModal());
    }, popup.delayMs);
    return () => window.clearTimeout(t);
    // yalnızca ilk yüklemede (sayfa geçişlerinde yeniden zamanlanmaz)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popup]);

  if (!popup || !mounted) return null;

  const close = () => {
    try {
      localStorage.setItem(seenKey(popup.id), "1");
    } catch {
      /* yok say */
    }
    const d = dialog.current;
    if (!d?.open) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return d.close();
    d.dataset.closing = "true";
    window.setTimeout(() => {
      delete d.dataset.closing;
      d.close();
    }, 260);
  };

  return (
    <dialog
      ref={dialog}
      aria-label="Duyuru"
      className="announce-modal m-auto w-[min(100%-1.5rem,880px)] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-[rgb(3_10_40/0.7)] backdrop:backdrop-blur-sm"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative overflow-hidden rounded-[24px] border border-white/15 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]">
        <Image src={popup.src} alt={popup.alt} width={popup.width} height={popup.height} sizes="(min-width: 920px) 880px, 100vw" className="block h-auto w-full" />
        {popup.linkUrl && popup.linkLabel ? (
          <div className="flex justify-center bg-[#031b61] px-4 py-4 sm:absolute sm:inset-x-0 sm:bottom-0 sm:justify-end sm:bg-transparent sm:bg-gradient-to-t sm:from-[rgb(3_10_40/0.85)] sm:to-transparent sm:pt-10 sm:pb-5">
            <Link
              href={popup.linkUrl}
              onClick={close}
              className="btn-shine inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#031b61] shadow-lg transition-transform hover:-translate-y-0.5"
              data-event="popup_click"
            >
              {popup.linkLabel} <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Duyuruyu kapat"
        autoFocus
        className="absolute -top-3 -right-3 flex size-11 items-center justify-center rounded-full border border-white/25 bg-[#031b61] text-white shadow-lg transition-transform duration-300 hover:rotate-90 sm:-top-4 sm:-right-4"
      >
        <X aria-hidden className="size-5" />
      </button>
    </dialog>
  );
}
