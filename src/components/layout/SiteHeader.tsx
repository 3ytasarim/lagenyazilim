"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import type { NavItem, NavService } from "./nav";

type Props = {
  nav: NavItem[];
  services: NavService[];
  phone: string;
  phoneE164: string;
  whatsappE164: string;
};

export function SiteHeader({ nav, services, phone, phoneE164, whatsappE164 }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const megaId = useId();
  const megaRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Mobil menü: yerleşik <dialog> (modal; odak hapsi, Esc ve arka plan erişilmezliği tarayıcıdan gelir)
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (mobileOpen && !d.open) d.showModal();
    else if (!mobileOpen && d.open) d.close();
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sayfa değişince menüler kapanır (render sırasında, efekt zinciri olmadan)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMegaOpen(false);
    const onClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const servicesActive = services.some((s) => pathname.startsWith(s.href)) || pathname.startsWith("/hizmetlerimiz");

  // Fareyle açılan menü, hemen ardından gelen tıklamayla kapanmasın (hover + click çakışması)
  const hoverOpened = useRef(false);
  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!megaOpen) hoverOpened.current = true;
    setMegaOpen(true);
  };
  const toggleMega = () => {
    if (hoverOpened.current) {
      hoverOpened.current = false;
      setMegaOpen(true);
      return;
    }
    setMegaOpen((v) => !v);
  };
  const scheduleClose = () => {
    hoverOpened.current = false;
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  const half = Math.ceil(nav.length / 2);
  const left = nav.slice(0, half);
  const right = nav.slice(half);
  const navLinkCls =
    "nav-underline inline-flex h-11 items-center gap-1 px-1 text-[0.8125rem] font-semibold tracking-[0.06em] whitespace-nowrap text-ink-muted uppercase transition-colors hover:text-ink [&.is-active]:text-ink";
  const renderItems = (items: NavItem[]) => (
    <>
      {items.map((item) =>
                item.mega === "services" ? (
                  <li key={item.href} ref={megaRef} onMouseEnter={openMega} onMouseLeave={scheduleClose}>
                    <button
                      type="button"
                      aria-expanded={megaOpen}
                      aria-controls={megaId}
                      onClick={toggleMega}
                      className={cn(navLinkCls, (servicesActive || megaOpen) && "is-active")}
                    >
                      {item.label}
                      <ChevronDown aria-hidden className={cn("size-4 transition-transform duration-300", megaOpen && "rotate-180")} />
                    </button>
                    <div
                      id={megaId}
                      hidden={!megaOpen}
                      className="mega-in absolute top-full left-1/2 z-50 w-[min(880px,calc(100vw-48px))] -translate-x-1/2 pt-2"
                    >
                      <div className="grid grid-cols-[1fr_260px] overflow-hidden rounded-lg border border-line bg-surface shadow-float">
                        <ul className="grid grid-cols-2 gap-1 p-3">
                          {services.map((s) => (
                            <li key={s.href}>
                              <Link
                                href={s.href}
                                className="group flex gap-4 rounded-md p-4 transition-colors hover:bg-surface-2/70"
                              >
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand">
                                  <ServiceIcon name={s.icon} className="size-5" />
                                </span>
                                <span>
                                  <span className="block font-semibold text-ink group-hover:text-brand">{s.name}</span>
                                  <span className="mt-1 line-clamp-2 block text-sm leading-snug text-ink-muted">{s.summary}</span>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-col justify-between bg-deep p-6 text-on-deep">
                          <div>
                            <p className="eyebrow text-on-deep-muted">Ücretsiz</p>
                            <p className="mt-3 font-display text-xl leading-snug">Siteniz arama motorlarında ne durumda?</p>
                            <p className="mt-2 text-sm text-on-deep-muted">Bir uzmanımız sitenizi inceleyip öncelikli fırsatları size iletsin.</p>
                          </div>
                          <div className="mt-6 flex flex-col gap-3">
                            <Link href="/ucretsiz-seo-analizi/" className={buttonClass("inverse", "sm")}>
                              SEO analizi isteyin
                            </Link>
                            <Link href="/hizmetlerimiz/" className="inline-flex items-center gap-1.5 text-sm font-medium text-on-deep-muted hover:text-on-deep">
                              Tüm hizmetler <ArrowRight aria-hidden className="size-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(navLinkCls, isActive(item.href) && "is-active")}
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
  
    </>
  );

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
        // Sayfanın başında şeffaf (hero arka planı altına uzanır), kaydırınca buzlu cam
        scrolled || megaOpen ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent bg-transparent",
      )}
    >
      {/* Masaüstü: logo tam ortada; menüler logoya eşit aralıkla yaslanır, uçlarda tema düğmesi ve teklif butonu (simetrik) */}
      <div className="container-site relative flex h-[var(--header-h)] items-center justify-between gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-x-12">
        <div className="hidden min-w-0 items-center justify-between gap-6 xl:flex">
          <ThemeToggle className="-ml-2.5" />
          <nav aria-label="Ana menü">
            <ul className="flex items-center gap-8 2xl:gap-10">{renderItems(left)}</ul>
          </nav>
        </div>

        <Logo priority size="lg" />

        <div className="hidden min-w-0 items-center justify-between gap-6 xl:flex">
          <nav aria-label="Ana menü (devam)">
            <ul className="flex items-center gap-8 2xl:gap-10">{renderItems(right)}</ul>
          </nav>
          <Link href="/proje-teklifi/" className={buttonClass("primary", "sm", "shrink-0")} data-event="service_cta_click" data-cta="header">
            Proje Teklifi Al
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 xl:hidden">
          <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/proje-teklifi/" className={buttonClass("primary", "sm", "hidden md:inline-flex")} data-event="service_cta_click" data-cta="header">
            Proje Teklifi Al
          </Link>

          <button
                type="button"
                aria-label="Menüyü aç"
                aria-haspopup="dialog"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
                className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-surface-2 xl:hidden"
              >
                <Menu aria-hidden className="size-5" />
              </button>
              <dialog
                ref={dialogRef}
                aria-label="Menü"
                onClose={() => setMobileOpen(false)}
                onClick={(e) => e.target === e.currentTarget && setMobileOpen(false)}
                className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-bg p-0 text-ink shadow-float backdrop:bg-deep/40 backdrop:backdrop-blur-sm open:flex open:flex-col xl:hidden"
              >
                <div className="flex h-[var(--header-h)] shrink-0 items-center justify-between border-b border-line px-4">
                  <Logo />
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                      <button type="button" aria-label="Menüyü kapat" onClick={() => setMobileOpen(false)} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-2">
                        <X aria-hidden className="size-5" />
                      </button>
                  </div>
                </div>
                <nav aria-label="Mobil menü" className="flex-1 overflow-y-auto px-4 py-6">
                  <ul className="flex flex-col">
                    <li>
                      <Link href="/" className="flex min-h-12 items-center border-b border-line text-lg font-medium">
                        Ana Sayfa
                      </Link>
                    </li>
                    {nav.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className="flex min-h-12 items-center border-b border-line text-lg font-medium">
                          {item.label}
                        </Link>
                        {item.mega === "services" ? (
                          <ul className="grid grid-cols-1 gap-0.5 py-2 pl-3">
                            {services.map((s) => (
                              <li key={s.href}>
                                <Link href={s.href} className="flex min-h-12 items-center gap-3 text-ink-muted hover:text-ink">
                                  <ServiceIcon name={s.icon} className="size-4 text-brand" />
                                  {s.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </nav>
                <div className="sticky bottom-0 grid gap-3 border-t border-line bg-bg p-4">
                  <Link href="/proje-teklifi/" className={buttonClass("primary", "lg", "w-full")} data-event="service_cta_click" data-cta="mobile-menu">
                    Proje Teklifi Al
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <a href={`tel:${phoneE164}`} className={buttonClass("secondary", "lg", "w-full")} data-event="phone_click">
                      <Phone aria-hidden className="size-4" /> Ara
                    </a>
                    <a href={`https://wa.me/${whatsappE164}`} target="_blank" rel="noopener" className={buttonClass("secondary", "lg", "w-full")} data-event="whatsapp_click">
                      <WhatsAppIcon className="size-4 text-[var(--wa)]" /> WhatsApp
                    </a>
                  </div>
                </div>
              </dialog>
          </div>
        </div>
      </div>
    </header>
    </>
  );
}
