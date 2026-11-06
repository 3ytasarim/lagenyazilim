"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { CheckboxField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaPicker";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import type { MediaRef } from "@/lib/media";
import { deletePopup, savePopup } from "@/server/actions/popups";

export type PopupRow = {
  id: string;
  title: string;
  image: MediaRef | null;
  alt: string;
  linkUrl: string | null;
  linkLabel: string | null;
  /** datetime-local biçiminde, Türkiye saati */
  startsAt: string;
  endsAt: string;
  startsLabel: string;
  endsLabel: string;
  isActive: boolean;
  delayMs: number;
  state: "live" | "scheduled" | "ended" | "off";
};

const STATE: Record<PopupRow["state"], { label: string; cls: string }> = {
  live: { label: "Yayında", cls: "bg-success/15 text-success" },
  scheduled: { label: "Zamanlandı", cls: "bg-brand-tint text-brand" },
  ended: { label: "Süresi doldu", cls: "bg-surface-2 text-ink-soft" },
  off: { label: "Pasif", cls: "bg-surface-2 text-ink-soft" },
};

export function PopupManager({ csrf, rows, defaults }: { csrf: string; rows: PopupRow[]; defaults: { startsAt: string; endsAt: string } }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PopupRow | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="grid content-start gap-4">
        {rows.length === 0 ? <p className="rounded-lg border border-line bg-surface p-8 text-center text-ink-muted">Henüz duyuru yok.</p> : null}
        {rows.map((r) => (
          <div key={r.id} className="flex min-w-0 gap-4 rounded-lg border border-line bg-surface p-4">
            {r.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image.variants["480"] ? `/media/${r.image.variants["480"]}` : r.image.url} alt="" className="h-20 w-32 shrink-0 rounded bg-surface-2 object-cover" />
            ) : (
              <span className="h-20 w-32 shrink-0 rounded bg-surface-2" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.title}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATE[r.state].cls}`}>{STATE[r.state].label}</span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                {r.startsLabel} → {r.endsLabel}
              </p>
              {r.linkUrl ? (
                <p className="mt-1 text-sm text-ink-soft">
                  Buton: {r.linkLabel} · <span className="font-mono">{r.linkUrl}</span>
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-start">
              <button type="button" aria-label="Düzenle" onClick={() => setEditing(r)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                <Pencil aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Sil"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm(`"${r.title}" duyurusu silinsin mi?`)) return;
                  const fd = new FormData();
                  fd.set("csrf", csrf);
                  fd.set("id", r.id);
                  start(async () => {
                    const res = await deletePopup(fd);
                    if (!res.ok) window.alert(res.message);
                    if (editing?.id === r.id) setEditing(null);
                    router.refresh();
                  });
                }}
                className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Card
        title={editing ? "Duyuruyu düzenle" : "Yeni duyuru"}
        description="Görsel, seçilen tarih aralığında sitede açılır pencere olarak gösterilir; bitiş tarihinden sonra kendiliğinden kalkar. Ziyaretçi kapattıktan sonra aynı duyuru o tarayıcıda tekrar açılmaz."
        actions={
          editing ? (
            <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>
              Yeni
            </button>
          ) : null
        }
      >
        <SaveForm action={savePopup} csrf={csrf} inline key={editing?.id ?? "new"}>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4">
            <TextField name="title" label="Başlık" hint="Yalnızca panelde görünür." defaultValue={editing?.title} required />
            <MediaField name="imageId" label="Görsel" csrf={csrf} initial={editing?.image ?? null} hint="Önerilen oran 3:2 (ör. 1536×1024)." />
            <TextField name="alt" label="Alt metin" hint="Görseldeki yazının kısa özeti (ekran okuyucular için)." defaultValue={editing?.alt} required />
            <div className="grid gap-4">
              <TextField name="startsAt" label="Başlangıç" type="datetime-local" defaultValue={editing?.startsAt ?? defaults.startsAt} required />
              <TextField name="endsAt" label="Bitiş" type="datetime-local" defaultValue={editing?.endsAt ?? defaults.endsAt} required />
            </div>
            <div className="grid gap-4">
              <TextField name="linkLabel" label="Buton metni" optional defaultValue={editing?.linkLabel ?? ""} placeholder="Hizmetlerimizi keşfedin" />
              <TextField name="linkUrl" label="Buton bağlantısı" optional defaultValue={editing?.linkUrl ?? ""} placeholder="/hizmetlerimiz/" />
            </div>
            <TextField name="delayMs" label="Açılma gecikmesi (sn)" type="number" min={1.5} max={15} step={0.5} defaultValue={String((editing?.delayMs ?? 2500) / 1000)} />
            <CheckboxField name="isActive" label="Etkin" defaultChecked={editing?.isActive ?? true} />
          </div>
        </SaveForm>
      </Card>
    </div>
  );
}
