"use client";

import { useState, type ComponentProps } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/forms/fields";
import { cn } from "@/lib/utils";
import { useFieldError } from "./SaveForm";

/* Admin formları için ad (name) tabanlı alanlar; hata mesajları SaveForm bağlamından okunur. */

type Base = { name: string; label: string; hint?: string; optional?: boolean; className?: string };

export function TextField({ name, label, hint, optional, className, ...rest }: Base & Omit<ComponentProps<"input">, "name">) {
  const error = useFieldError(name);
  return (
    <Field id={`f-${name}`} label={label} hint={hint} error={error} optional={optional} className={className}>
      <Input id={`f-${name}`} name={name} aria-invalid={!!error} data-field-error={error ? "" : undefined} {...rest} />
    </Field>
  );
}

export function TextAreaField({ name, label, hint, optional, className, ...rest }: Base & Omit<ComponentProps<"textarea">, "name">) {
  const error = useFieldError(name);
  return (
    <Field id={`f-${name}`} label={label} hint={hint} error={error} optional={optional} className={className}>
      <Textarea id={`f-${name}`} name={name} aria-invalid={!!error} data-field-error={error ? "" : undefined} {...rest} />
    </Field>
  );
}

export function SelectField({ name, label, hint, optional, className, options, ...rest }: Base & { options: { value: string; label: string }[] } & Omit<ComponentProps<"select">, "name">) {
  const error = useFieldError(name);
  return (
    <Field id={`f-${name}`} label={label} hint={hint} error={error} optional={optional} className={className}>
      <Select id={`f-${name}`} name={name} aria-invalid={!!error} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function CheckboxField({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer gap-3">
      <input type="checkbox" name={name} value="1" defaultChecked={defaultChecked} className="mt-1 size-[18px] shrink-0 accent-[var(--brand)]" />
      <span>
        <span className="block text-[0.9375rem] font-semibold">{label}</span>
        {hint ? <span className="block text-sm text-ink-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Başlık + metin çiftlerinden oluşan liste (kapsam, süreç adımları). JSON olarak tek gizli alana yazılır. */
export function PairRepeater({
  name,
  label,
  initial,
  keys = ["title", "text"],
  labels = ["Başlık", "Açıklama"],
  addLabel = "Satır ekle",
}: {
  name: string;
  label: string;
  initial: Record<string, string>[];
  keys?: [string, string];
  labels?: [string, string];
  addLabel?: string;
}) {
  const [rows, setRows] = useState(initial.length ? initial : []);
  const error = useFieldError(name);
  const update = (i: number, k: string, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j]!, next[i]!];
    setRows(next);
  };
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-2 text-[0.9375rem] font-semibold">{label}</legend>
      <input type="hidden" name={name} value={JSON.stringify(rows.filter((r) => (r[keys[0]] ?? "").trim() || (r[keys[1]] ?? "").trim()))} />
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-line bg-bg p-3 sm:grid-cols-[28px_1fr_auto]">
          <div className="hidden flex-col items-center gap-1 pt-2 text-ink-soft sm:flex">
            <button type="button" aria-label="Yukarı taşı" onClick={() => move(i, -1)} className="text-xs hover:text-ink">
              ▲
            </button>
            <GripVertical aria-hidden className="size-4" />
            <button type="button" aria-label="Aşağı taşı" onClick={() => move(i, 1)} className="text-xs hover:text-ink">
              ▼
            </button>
          </div>
          <div className="grid gap-2">
            <Input aria-label={`${labels[0]} ${i + 1}`} placeholder={labels[0]} value={r[keys[0]] ?? ""} onChange={(e) => update(i, keys[0], e.target.value)} />
            <Textarea aria-label={`${labels[1]} ${i + 1}`} placeholder={labels[1]} rows={2} className="min-h-0" value={r[keys[1]] ?? ""} onChange={(e) => update(i, keys[1], e.target.value)} />
          </div>
          <button type="button" aria-label="Satırı sil" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="inline-flex size-10 items-center justify-center self-start rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger">
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setRows([...rows, { [keys[0]]: "", [keys[1]]: "" }])} className="inline-flex h-10 items-center gap-2 justify-self-start rounded-md border border-dashed border-line-strong px-4 text-sm font-medium hover:border-brand hover:text-brand">
        <Plus aria-hidden className="size-4" /> {addLabel}
      </button>
      {error ? (
        <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Virgül / Enter ile eklenen etiket listesi (string[]). */
export function TagsField({ name, label, initial, hint, suggestions }: { name: string; label: string; initial: string[]; hint?: string; suggestions?: string[] }) {
  const [tags, setTags] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const add = (v: string) => {
    const t = v.trim().replace(/,$/, "");
    if (t && !tags.includes(t) && tags.length < 30) setTags([...tags, t.slice(0, 80)]);
    setDraft("");
  };
  return (
    <div className="grid gap-2">
      <label htmlFor={`f-${name}`} className="text-[0.9375rem] font-semibold">
        {label}
      </label>
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-line-strong bg-surface p-2 focus-within:border-brand">
        {tags.map((t) => (
          <span key={t} className="inline-flex h-8 items-center gap-1 rounded-full bg-brand-tint pr-1 pl-3 text-sm text-brand">
            {t}
            <button type="button" aria-label={`${t} kaldır`} onClick={() => setTags(tags.filter((x) => x !== t))} className="inline-flex size-6 items-center justify-center rounded-full hover:bg-brand/15">
              ×
            </button>
          </span>
        ))}
        <input
          id={`f-${name}`}
          list={suggestions ? `${name}-list` : undefined}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && tags.length) setTags(tags.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          className="h-8 min-w-32 flex-1 bg-transparent px-1 outline-none"
        />
        {suggestions ? (
          <datalist id={`${name}-list`}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5", className)}>{children}</div>;
}
