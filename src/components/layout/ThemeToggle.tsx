"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "lagen-theme";

/** İlk boyamadan önce temayı ayarlayan satır içi betik (layout <head> içinde). Varsayılan koyu; açık tema kullanıcı seçimiyle kaydedilir. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t="dark"}document.documentElement.dataset.theme=t}catch(e){}document.documentElement.classList.add("js")})();`;

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* gizli mod: tercih bu oturumla sınırlı kalır */
    }
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Açık / koyu tema"
      className={cn("inline-flex size-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink", className)}
    >
      <Sun aria-hidden className="size-[18px] dark:hidden" />
      <Moon aria-hidden className="hidden size-[18px] dark:block" />
    </button>
  );
}
