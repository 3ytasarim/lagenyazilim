"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/server/actions/_guard";

type Result = ActionResult<{ redirect?: string } | unknown>;
const ErrorsCtx = createContext<Record<string, string>>({});

/** Alan hata mesajı; SaveForm içindeki herhangi bir yerde kullanılabilir. */
export function useFieldError(name: string) {
  return useContext(ErrorsCtx)[name];
}

/**
 * Admin düzenleme formları için ortak kabuk: FormData'yı server action'a gönderir,
 * CSRF alanını ekler, alan hatalarını ve sonuç mesajını gösterir.
 */
export function SaveForm({
  action,
  csrf,
  children,
  submitLabel = "Kaydet",
  extraActions,
  className,
  inline = false,
}: {
  action: (fd: FormData) => Promise<Result>;
  csrf: string;
  children: ReactNode;
  submitLabel?: string;
  extraActions?: ReactNode;
  className?: string;
  /** Kart içinde: yapışkan alt çubuk yerine düz düğme satırı */
  inline?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("csrf", csrf);
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.name) fd.set(submitter.name, submitter.value);
        start(async () => {
          const res = await action(fd);
          setResult(res);
          if (res.ok) {
            const target = (res.data as { redirect?: string } | undefined)?.redirect;
            if (target) router.push(target);
            else router.refresh();
          } else {
            requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-field-error]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
          }
        });
      }}
    >
      <ErrorsCtx.Provider value={result && !result.ok ? (result.fieldErrors ?? {}) : {}}>{children}</ErrorsCtx.Provider>
      <div className={inline ? "mt-5 flex flex-wrap items-center gap-3" : "sticky bottom-0 z-10 -mx-4 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-bg/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8 lg:-mx-10 lg:px-10"}>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
        {extraActions}
        <div aria-live="polite" className="text-sm">
          {result?.ok && result.message ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 aria-hidden className="size-4" /> {result.message}
            </span>
          ) : null}
          {result && !result.ok ? <span className="font-medium text-danger">{result.message}</span> : null}
        </div>
      </div>
    </form>
  );
}
