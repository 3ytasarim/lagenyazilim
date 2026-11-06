"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Input, Select } from "@/components/forms/fields";
import { CheckboxField, TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import { deleteFormOption, saveBudgetRange, saveQuoteOption } from "@/server/actions/crm";

type Field = { key: string; label: string; type: string; options?: string[] };
type Option = { id: string; key: string; label: string; description: string | null; extraFields: Field[]; sortOrder: number; isActive: boolean; used: number };
type Budget = { id: string; label: string; minTry: number | null; maxTry: number | null; sortOrder: number; isActive: boolean };

function ExtraFieldsEditor({ initial }: { initial: Field[] }) {
  const [rows, setRows] = useState<Field[]>(initial);
  const set = (i: number, patch: Partial<Field>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-[0.9375rem] font-semibold">Bu hizmete özel sorular</legend>
      <input type="hidden" name="extraFields" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-line bg-bg p-3 sm:grid-cols-[1fr_1.4fr_140px_auto]">
          <Input aria-label="Anahtar" placeholder="anahtar (ör. web_pages)" value={r.key} onChange={(e) => set(i, { key: e.target.value })} className="h-10 text-sm" />
          <Input aria-label="Soru" placeholder="Soru metni" value={r.label} onChange={(e) => set(i, { label: e.target.value })} className="h-10 text-sm" />
          <Select aria-label="Tür" value={r.type} onChange={(e) => set(i, { type: e.target.value })} className="h-10 text-sm">
            <option value="text">Kısa metin</option>
            <option value="textarea">Uzun metin</option>
            <option value="select">Tek seçim</option>
            <option value="multiselect">Çoklu seçim</option>
            <option value="number">Sayı</option>
          </Select>
          <button type="button" aria-label="Soruyu sil" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger">
            <Trash2 aria-hidden className="size-4" />
          </button>
          {r.type === "select" || r.type === "multiselect" ? (
            <Input aria-label="Seçenekler" placeholder="Seçenekler, virgülle ayırın" value={(r.options ?? []).join(", ")} onChange={(e) => set(i, { options: e.target.value.split(",").map((s) => s.trim()) })} className="h-10 text-sm sm:col-span-4" />
          ) : null}
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { key: "", label: "", type: "text" }])} className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md border border-dashed border-line-strong px-4 text-sm font-medium hover:border-brand hover:text-brand">
        <Plus aria-hidden className="size-4" /> Soru ekle
      </button>
    </fieldset>
  );
}

function Del({ csrf, kind, id, label }: { csrf: string; kind: string; id: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={`${label} sil`}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`"${label}" silinsin mi?`)) return;
        const fd = new FormData();
        fd.set("csrf", csrf);
        fd.set("kind", kind);
        fd.set("id", id);
        start(async () => {
          const r = await deleteFormOption(fd);
          if (!r.ok) window.alert(r.message);
          router.refresh();
        });
      }}
      className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
}

export function FormOptionsManager({ csrf, options, budgets }: { csrf: string; options: Option[]; budgets: Budget[] }) {
  const [editing, setEditing] = useState<Option | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card title="Hizmet seçenekleri" description="Sihirbazın 1. adımında görünür. Pasif seçenekler formda gösterilmez.">
          <ul className="divide-y divide-line">
            {options.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5">
                <span className="w-8 text-sm text-ink-soft tabular-nums">{o.sortOrder}</span>
                <span className="min-w-0 flex-1">
                  <span className={o.isActive ? "font-medium" : "font-medium text-ink-soft line-through"}>{o.label}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    {o.key} · {o.extraFields.length} soru · {o.used} teklif
                  </span>
                </span>
                <button type="button" aria-label={`${o.label} düzenle`} onClick={() => setEditing(o)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                  <Pencil aria-hidden className="size-4" />
                </button>
                <Del csrf={csrf} kind="option" id={o.id} label={o.label} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title={editing ? `Düzenle: ${editing.label}` : "Yeni hizmet seçeneği"} actions={editing ? <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>Yeni</button> : null}>
          <SaveForm action={saveQuoteOption} csrf={csrf} inline key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="label" label="Ad" defaultValue={editing?.label} required />
                <TextField name="key" label="Anahtar" hint="Hizmet sayfası ön seçimi için (ör. kurumsal-web)" defaultValue={editing?.key} required />
              </div>
              <TextField name="description" label="Kısa açıklama" defaultValue={editing?.description ?? ""} optional />
              <TextField name="sortOrder" label="Sıra" type="number" defaultValue={String(editing?.sortOrder ?? 0)} />
              <CheckboxField name="isActive" label="Formda göster" defaultChecked={editing?.isActive ?? true} />
              <ExtraFieldsEditor initial={editing?.extraFields ?? []} />
            </div>
          </SaveForm>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card title="Bütçe aralıkları" description="Teklif kaydı seçilen etiketin kopyasını saklar; aralığı sonradan değiştirmek eski talepleri etkilemez.">
          <ul className="divide-y divide-line">
            {budgets.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                <span className="w-8 text-sm text-ink-soft tabular-nums">{b.sortOrder}</span>
                <span className={`min-w-0 flex-1 ${b.isActive ? "font-medium" : "text-ink-soft line-through"}`}>{b.label}</span>
                <button type="button" aria-label={`${b.label} düzenle`} onClick={() => setEditingBudget(b)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                  <Pencil aria-hidden className="size-4" />
                </button>
                <Del csrf={csrf} kind="budget" id={b.id} label={b.label} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title={editingBudget ? "Bütçe aralığını düzenle" : "Yeni bütçe aralığı"} actions={editingBudget ? <button type="button" className="text-sm text-brand" onClick={() => setEditingBudget(null)}>Yeni</button> : null}>
          <SaveForm action={saveBudgetRange} csrf={csrf} inline key={editingBudget?.id ?? "new"}>
            <input type="hidden" name="id" value={editingBudget?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="label" label="Etiket" defaultValue={editingBudget?.label} className="sm:col-span-2" required />
              <TextField name="minTry" label="Alt sınır (₺)" type="number" defaultValue={editingBudget?.minTry?.toString() ?? ""} optional />
              <TextField name="maxTry" label="Üst sınır (₺)" type="number" defaultValue={editingBudget?.maxTry?.toString() ?? ""} optional />
              <TextField name="sortOrder" label="Sıra" type="number" defaultValue={String(editingBudget?.sortOrder ?? 0)} />
              <div className="self-end pb-3">
                <CheckboxField name="isActive" label="Formda göster" defaultChecked={editingBudget?.isActive ?? true} />
              </div>
            </div>
          </SaveForm>
        </Card>
      </div>
    </div>
  );
}
