"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Config = { provider: "none" | "ga4" | "umami"; ga4Id: string; umamiUrl: string; umamiSiteId: string };
type Choice = "analytics" | "necessary";

const COOKIE = "lagen_consent";
const VERSION = "1";

function readChoice(): Choice | null {
  const m = document.cookie.match(/(?:^|; )lagen_consent=([^;]+)/);
  if (!m) return null;
  const [v, choice] = decodeURIComponent(m[1]!).split(":");
  return v === VERSION && (choice === "analytics" || choice === "necessary") ? choice : null;
}

function writeChoice(c: Choice) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(`${VERSION}:${c}`)}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    umami?: { track: (name: string, data?: Record<string, unknown>) => void };
  }
}

/** Analitik betiğini yalnızca onaydan sonra, bir kez yükler. Satır içi betik kullanılmaz (CSP ile uyumlu). */
function loadAnalytics(cfg: Config) {
  if (document.getElementById("lagen-analytics")) return;
  if (cfg.provider === "ga4" && /^G-[A-Z0-9]+$/.test(cfg.ga4Id)) {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4Id, { anonymize_ip: true });
    const s = document.createElement("script");
    s.id = "lagen-analytics";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4Id}`;
    document.head.appendChild(s);
  } else if (cfg.provider === "umami" && /^https:\/\//.test(cfg.umamiUrl) && cfg.umamiSiteId) {
    const s = document.createElement("script");
    s.id = "lagen-analytics";
    s.defer = true;
    s.src = cfg.umamiUrl;
    s.dataset.websiteId = cfg.umamiSiteId;
    document.head.appendChild(s);
  }
}

export function ConsentAndAnalytics({ config }: { config: Config }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Çerez yalnızca istemcide okunur; sunucu çıktısını etkilemez (banner başlangıçta kapalı)
  const [choice, setChoice] = useState<Choice | null>(() => (typeof document === "undefined" ? null : readChoice()));
  const analyticsAvailable = config.provider !== "none";

  useEffect(() => {
    // Analitik kapalıysa banner gösterilmez: yalnızca zorunlu çerez kullanılıyor. İlk boyamadan sonra açılır (LCP'yi etkilemez).
    const t = window.setTimeout(() => {
      if (!readChoice() && analyticsAvailable) setOpen(true);
    }, 600);
    const reopen = () => setOpen(true);
    window.addEventListener("lagen:consent-open", reopen);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("lagen:consent-open", reopen);
    };
  }, [analyticsAvailable]);

  useEffect(() => {
    if (choice === "analytics" && analyticsAvailable) loadAnalytics(config);
  }, [choice, analyticsAvailable, config]);

  // Olay köprüsü: data-event öznitelikli tıklamalar + track() olayları → seçili sağlayıcı (yalnızca onay varsa)
  const send = useCallback(
    (name: string, params: Record<string, unknown> = {}) => {
      if (choice !== "analytics") return;
      if (config.provider === "ga4") window.gtag?.("event", name, params);
      else if (config.provider === "umami") window.umami?.track(name, params);
    },
    [choice, config.provider],
  );

  useEffect(() => {
    const onTrack = (e: Event) => {
      const d = (e as CustomEvent<{ name: string; params?: Record<string, unknown> }>).detail;
      if (d?.name) send(d.name, d.params);
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-event]");
      if (el) send(el.dataset.event!, { cta: el.dataset.cta ?? "", path: location.pathname });
    };
    window.addEventListener("lagen:track", onTrack);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("lagen:track", onTrack);
      document.removeEventListener("click", onClick);
    };
  }, [send]);

  useEffect(() => {
    if (choice === "analytics" && config.provider === "ga4" && pathname) window.gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname, choice, config.provider]);

  if (!open) return null;
  const decide = (c: Choice) => {
    writeChoice(c);
    setChoice(c);
    setOpen(false);
    // Onay geri alındıysa yüklenmiş betiğin etkisi için sayfa yenilenir
    if (c === "necessary" && document.getElementById("lagen-analytics")) location.reload();
  };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-[84px] z-50 mx-auto max-w-xl rounded-lg border border-line bg-surface p-5 shadow-float md:bottom-5">
      <p id="consent-title" className="font-semibold">
        Çerez tercihleriniz
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Siteyi çalıştırmak için zorunlu çerezler kullanıyoruz. İzin verirseniz ziyaret istatistikleri için analitik çerezler de kullanılır. Ayrıntılar{" "}
        <Link href="/cerez-politikasi/" className="font-medium text-brand underline-offset-2 hover:underline">
          Çerez Politikası
        </Link>
        &apos;nda.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => decide("necessary")} className="h-11 rounded-full border border-line-strong px-5 text-sm font-semibold hover:border-ink">
          Yalnızca zorunlu
        </button>
        <button type="button" onClick={() => decide("analytics")} className="h-11 rounded-full bg-brand px-5 text-sm font-semibold text-on-brand hover:bg-brand-hover">
          Analitiğe izin ver
        </button>
      </div>
    </div>
  );
}

export function ConsentReopenButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event("lagen:consent-open"))} className={className}>
      Çerez tercihleri
    </button>
  );
}
