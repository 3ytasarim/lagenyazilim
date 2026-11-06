"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

/** Masaüstünde sağ kenarda sabit iletişim çubuğu (mobilde StickyCta kullanılır). */
export function FloatingRail({ phoneE164, whatsappE164 }: { phoneE164: string; whatsappE164: string }) {
  const pathname = usePathname().replace(/\/+$/, "");
  const onQuote = pathname === "/proje-teklifi";
  const base = "group relative flex size-12 items-center justify-center rounded-full shadow-card transition-[transform,background-color,color,border-color] duration-300 hover:-translate-x-1";
  const item = `${base} border border-line bg-surface/85 text-ink backdrop-blur`;
  const label =
    "pointer-events-none absolute right-[calc(100%+10px)] rounded-full bg-ink px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-bg opacity-0 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 translate-x-1 group-hover:translate-x-0";

  return (
    <aside aria-label="Hızlı iletişim" className="rail-in fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex">
      <a
        href={`https://wa.me/${whatsappE164}`}
        target="_blank"
        rel="noopener"
        data-event="whatsapp_click"
        className={`${base} bg-[var(--wa)] text-white`}
      >
        <WhatsAppIcon className="size-6" />
        <span className={label}>WhatsApp ile yazın</span>
      </a>
      <a href={`tel:${phoneE164}`} data-event="phone_click" className={`${item} hover:border-brand hover:text-brand`}>
        <Phone aria-hidden className="size-5" />
        <span className={label}>Hemen arayın</span>
      </a>
      {onQuote ? null : (
        <Link
          href="/proje-teklifi/"
          data-event="service_cta_click"
          data-cta="rail"
          className="btn-shine btn-induction group flex flex-col items-center gap-2 rounded-full bg-brand px-3 py-4 text-on-brand shadow-card transition-transform duration-300 hover:-translate-x-1 hover:bg-brand-hover"
        >
          <FileText aria-hidden className="size-4" />
          <span className="text-[13px] font-semibold tracking-wide [writing-mode:vertical-rl] rotate-180">Teklif Al</span>
        </Link>
      )}
    </aside>
  );
}
