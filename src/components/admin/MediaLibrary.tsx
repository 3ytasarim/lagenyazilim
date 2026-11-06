"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/forms/fields";
import { Button } from "@/components/ui/Button";
import { deleteMedia, updateMedia, uploadMedia } from "@/server/actions/media";

type Item = { id: string; thumb: string; alt: string; caption: string | null; name: string; width: number | null; height: number | null; sizeKb: number; createdAt: string };

export function MediaLibrary({ csrf, items }: { csrf: string; items: Item[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);

  const call = (fn: () => Promise<{ ok: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      setMsg({ ok: r.ok, text: r.message ?? "" });
      router.refresh();
    });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Button onClick={() => fileRef.current?.click()} disabled={pending}>
            {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Upload aria-hidden className="size-4" />} Görsel yükle
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files?.length) return;
              const fd = new FormData();
              fd.set("csrf", csrf);
              Array.from(files).forEach((f) => fd.append("files", f));
              call(() => uploadMedia(fd));
              e.target.value = "";
            }}
          />
          <p className="text-sm text-ink-soft">PNG, JPG, WEBP, AVIF · en fazla 10 MB. Görseller otomatik olarak WebP&apos;ye dönüştürülür ve 480 / 960 / 1600 px boyutlarında saklanır.</p>
        </div>
        {msg ? <p className={`mb-4 text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p> : null}
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong p-12 text-center text-ink-muted">Henüz görsel yok.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSelected(m)} className={`block w-full overflow-hidden rounded-md border text-left ${selected?.id === m.id ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-ink-soft"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb} alt="" loading="lazy" className="aspect-square w-full bg-surface-2 object-cover" />
                  <span className={`flex items-center gap-1 truncate px-2 py-1.5 text-xs ${m.alt ? "text-ink-muted" : "text-warning"}`}>
                    {!m.alt ? <AlertTriangle aria-hidden className="size-3 shrink-0" /> : null}
                    {m.alt || "Alt metin yok"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="rounded-lg border border-line bg-surface p-5 xl:sticky xl:top-6 xl:self-start">
        {selected ? (
          <form
            key={selected.id}
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("csrf", csrf);
              fd.set("id", selected.id);
              call(() => updateMedia(fd));
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.thumb} alt="" className="w-full rounded-md bg-surface-2" />
            <dl className="grid grid-cols-[90px_1fr] gap-1 text-sm">
              <dt className="text-ink-soft">Dosya</dt>
              <dd className="truncate">{selected.name}</dd>
              <dt className="text-ink-soft">Boyut</dt>
              <dd>
                {selected.width}×{selected.height} · {selected.sizeKb} KB (orijinal)
              </dd>
              <dt className="text-ink-soft">Yüklenme</dt>
              <dd>{selected.createdAt}</dd>
            </dl>
            <div className="grid gap-2">
              <label htmlFor="m-alt" className="text-[0.9375rem] font-semibold">
                Alt metin
              </label>
              <Input id="m-alt" name="alt" defaultValue={selected.alt} placeholder="Görselde ne görünüyor?" maxLength={300} />
              <p className="text-xs text-ink-soft">Ekran okuyucular ve arama motorları için. Dekoratif görsellerde boş bırakılabilir.</p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="m-caption" className="text-[0.9375rem] font-semibold">
                Açıklama <span className="font-normal text-ink-soft">(isteğe bağlı)</span>
              </label>
              <Input id="m-caption" name="caption" defaultValue={selected.caption ?? ""} maxLength={500} />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                Kaydet
              </Button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Görsel kalıcı olarak silinsin mi?")) return;
                  const fd = new FormData();
                  fd.set("csrf", csrf);
                  fd.set("id", selected.id);
                  call(async () => {
                    const r = await deleteMedia(fd);
                    if (r.ok) setSelected(null);
                    return r;
                  });
                }}
                className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-danger hover:bg-danger/10"
              >
                <Trash2 aria-hidden className="size-4" /> Sil
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-ink-muted">Ayrıntıları görmek ve alt metin eklemek için bir görsel seçin.</p>
        )}
      </aside>
    </div>
  );
}
