"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { retryNotification } from "@/server/actions/crm";

export function RetryButton({ csrf, id }: { csrf: string; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const fd = new FormData();
          fd.set("csrf", csrf);
          fd.set("id", id);
          start(async () => {
            const r = await retryNotification(fd);
            setMsg(r.ok ? (r.message ?? "") : r.message);
            router.refresh();
          });
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-brand hover:bg-brand-tint"
      >
        <RotateCw aria-hidden className={`size-3.5 ${pending ? "animate-spin" : ""}`} /> Yeniden gönder
      </button>
      {msg ? <span className="text-xs text-ink-muted">{msg}</span> : null}
    </span>
  );
}
