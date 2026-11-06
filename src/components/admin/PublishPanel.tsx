"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { History, Loader2, Trash2 } from "lucide-react";
import { Input, Select } from "@/components/forms/fields";
import type { ActionResult } from "@/server/actions/_guard";
import { restoreRevision } from "@/server/actions/revisions";

const STATUSES = [
  { value: "draft", label: "Taslak" },
  { value: "review", label: "İncelemede" },
  { value: "published", label: "Yayında / zamanlanmış" },
  { value: "archived", label: "Arşiv (yayından kaldırıldı)" },
];

/** Durum + yayın tarihi. İleri bir tarih seçilirse içerik o ana kadar görünmez (zamanlanmış yayın). */
export function PublishPanel({ status, publishedAt, publicUrl }: { status: string; publishedAt: string; publicUrl?: string | null }) {
  const [s, setS] = useState(status);
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="f-status" className="text-[0.9375rem] font-semibold">
          Durum
        </label>
        <Select id="f-status" name="status" value={s} onChange={(e) => setS(e.target.value)}>
          {STATUSES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="f-publishedAt" className="text-[0.9375rem] font-semibold">
          Yayın tarihi <span className="font-normal text-ink-soft">(Türkiye saati)</span>
        </label>
        <Input id="f-publishedAt" name="publishedAt" type="datetime-local" defaultValue={publishedAt} />
        <p className="text-sm text-ink-soft">{s === "published" ? "Boş bırakılırsa hemen yayınlanır; ileri tarih seçerseniz o an yayına girer." : "Taslak, incelemede ve arşivdeki içerikler sitede görünmez ve indekslenmez."}</p>
      </div>
      {publicUrl ? (
        <a href={publicUrl} target="_blank" className="text-sm font-medium text-brand hover:underline">
          Sitede görüntüle ↗
        </a>
      ) : null}
    </div>
  );
}

export function RevisionList({ csrf, items }: { csrf: string; items: { id: string; createdAt: string; note: string | null; author: string | null }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (items.length === 0) return <p className="text-sm text-ink-muted">Henüz revizyon yok. Her kayıttan önce önceki sürüm otomatik saklanır.</p>;
  return (
    <div>
      <ul className="grid gap-2 text-sm">
        {items.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2">
            <span className="min-w-0">
              <span className="block">{r.createdAt}</span>
              <span className="block truncate text-xs text-ink-soft">{[r.author, r.note].filter(Boolean).join(" · ")}</span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Bu sürüm geri yüklensin mi? Mevcut hâl de revizyon olarak saklanacak.")) return;
                const fd = new FormData();
                fd.set("csrf", csrf);
                fd.set("revisionId", r.id);
                start(async () => {
                  const res = await restoreRevision(fd);
                  setMsg(res.ok ? (res.message ?? "") : res.message);
                  if (res.ok) {
                    router.refresh();
                    // Form alanları varsayılan değerlerle çizildiği için sayfayı tazelemek gerekir
                    window.location.reload();
                  }
                });
              }}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 font-medium text-brand hover:bg-brand-tint"
            >
              {pending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <History aria-hidden className="size-3.5" />} Geri yükle
            </button>
          </li>
        ))}
      </ul>
      {msg ? <p className="mt-2 text-sm text-ink-muted">{msg}</p> : null}
    </div>
  );
}

export function DeleteButton({ action, csrf, id, label = "Sil", confirmText }: { action: (fd: FormData) => Promise<ActionResult<{ redirect?: string }>>; csrf: string; id: string; label?: string; confirmText: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          const fd = new FormData();
          fd.set("csrf", csrf);
          fd.set("id", id);
          start(async () => {
            const res = await action(fd);
            if (res.ok) router.push(res.data?.redirect ?? "./");
            else setErr(res.message);
          });
        }}
        className="inline-flex h-12 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold text-danger hover:bg-danger/10"
      >
        <Trash2 aria-hidden className="size-4" /> {label}
      </button>
      {err ? <span className="text-sm text-danger">{err}</span> : null}
    </span>
  );
}
