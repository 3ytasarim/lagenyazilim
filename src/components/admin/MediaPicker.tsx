"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ImagePlus, Loader2, Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MediaRef } from "@/lib/media";
import { cn } from "@/lib/utils";
import { listMedia, uploadMedia } from "@/server/actions/media";

/** Medya kütüphanesi seçim penceresi; aynı pencereden yükleme de yapılabilir. */
export function MediaDialog({ csrf, open, onOpenChange, onSelect }: { csrf: string; open: boolean; onOpenChange: (v: boolean) => void; onSelect: (m: MediaRef) => void }) {
  const [items, setItems] = useState<MediaRef[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [uploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    (query: string) =>
      startLoading(async () => {
        const res = await listMedia({ csrf, q: query || undefined });
        if (res.ok && res.data) setItems(res.data.items);
        else if (!res.ok) setError(res.message);
      }),
    [csrf],
  );

  useEffect(() => {
    if (open) load("");
  }, [open, load]);

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const fd = new FormData();
    fd.set("csrf", csrf);
    Array.from(files).forEach((f) => fd.append("files", f));
    setError(null);
    startUpload(async () => {
      const res = await uploadMedia(fd);
      if (res.ok && res.data) setItems([...res.data, ...items]);
      else if (!res.ok) setError(res.message);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-deep/50" />
        <Dialog.Content className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-lg bg-surface shadow-float md:inset-x-auto md:top-[8vh] md:left-1/2 md:h-[84vh] md:w-[min(960px,92vw)] md:-translate-x-1/2">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Dialog.Title className="font-semibold">Medya kütüphanesi</Dialog.Title>
            <Dialog.Description className="sr-only">Bir görsel seçin veya yeni görsel yükleyin</Dialog.Description>
            <form
              className="ml-auto flex items-center gap-2 rounded-md border border-line-strong px-3"
              onSubmit={(e) => {
                e.preventDefault();
                load(q);
              }}
            >
              <Search aria-hidden className="size-4 text-ink-soft" />
              <input aria-label="Görsellerde ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara" className="h-9 w-36 bg-transparent text-sm outline-none" />
            </form>
            <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />} Yükle
            </Button>
            <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,image/avif" className="hidden" onChange={(e) => upload(e.target.files)} />
            <Dialog.Close asChild>
              <button type="button" aria-label="Kapat" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-surface-2">
                <X aria-hidden className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          {error ? (
            <p role="alert" className="border-b border-line bg-danger/5 px-4 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && items.length === 0 ? (
              <p className="py-16 text-center text-ink-muted">Yükleniyor…</p>
            ) : items.length === 0 ? (
              <p className="py-16 text-center text-ink-muted">Henüz görsel yok. Sağ üstten yükleyebilirsiniz.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {items.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(m);
                        onOpenChange(false);
                      }}
                      className="group block w-full overflow-hidden rounded-md border border-line text-left hover:border-brand focus-visible:border-brand"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.variants["480"] ? `/media/${m.variants["480"]}` : m.url} alt="" className="aspect-square w-full bg-surface-2 object-cover" loading="lazy" />
                      <span className={cn("block truncate px-2 py-1.5 text-xs", m.alt ? "text-ink-muted" : "text-warning")}>{m.alt || "Alt metin yok"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Form alanı: seçilen görselin id'sini gizli alana yazar. */
export function MediaField({ name, label, csrf, initial, hint }: { name: string; label: string; csrf: string; initial: MediaRef | null; hint?: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<MediaRef | null>(initial);
  return (
    <div className="grid gap-2">
      <span className="text-[0.9375rem] font-semibold">{label}</span>
      <input type="hidden" name={name} value={value?.id ?? ""} />
      {value ? (
        <div className="flex items-start gap-4 rounded-md border border-line p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.variants["480"] ? `/media/${value.variants["480"]}` : value.url} alt="" className="h-20 w-28 rounded bg-surface-2 object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className={value.alt ? "text-ink-muted" : "font-medium text-warning"}>{value.alt || "Bu görselin alt metni yok — Medya sayfasından ekleyin."}</p>
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={() => setOpen(true)} className="font-medium text-brand hover:underline">
                Değiştir
              </button>
              <button type="button" onClick={() => setValue(null)} className="font-medium text-danger hover:underline">
                Kaldır
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex h-24 items-center justify-center gap-2 rounded-md border border-dashed border-line-strong text-sm font-medium text-ink-muted hover:border-brand hover:text-brand">
          <ImagePlus aria-hidden className="size-5" /> Görsel seçin
        </button>
      )}
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
      <MediaDialog csrf={csrf} open={open} onOpenChange={setOpen} onSelect={setValue} />
    </div>
  );
}
