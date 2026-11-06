"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

/** Mobilde sabit alt çubuk. Form sayfalarında gösterilmez (formun kendi gönder düğmesiyle çakışmasın). */
const HIDDEN_ON = ["/proje-teklifi", "/ucretsiz-seo-analizi", "/iletisim"];

export function StickyCta({ phoneE164, whatsappE164 }: { phoneE164: string; whatsappE164: string }) {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname.replace(/\/+$/, ""))) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-[48px_48px_1fr] gap-2 p-2">
        <a href={`tel:${phoneE164}`} aria-label="Telefonla arayın" data-event="phone_click" className="flex h-12 items-center justify-center rounded-full border border-line-strong text-ink">
          <Phone aria-hidden className="size-5" />
        </a>
        <a
          href={`https://wa.me/${whatsappE164}`}
          target="_blank"
          rel="noopener"
          aria-label="WhatsApp ile yazın"
          data-event="whatsapp_click"
          className="flex h-12 items-center justify-center rounded-full bg-[var(--wa)] text-white"
        >
          <WhatsAppIcon className="size-6" />
        </a>
        <Link href="/proje-teklifi/" data-event="service_cta_click" data-cta="sticky" className="btn-shine btn-induction flex h-12 items-center justify-center rounded-full bg-brand font-semibold text-on-brand">
          Proje Teklifi Al
        </Link>
      </div>
    </div>
  );
}
