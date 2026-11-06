"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/forms/fields";
import { cn } from "@/lib/utils";
import { CheckboxField, TagsField } from "./fields";
import { useFieldError } from "./SaveForm";

export type SeoValues = {
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  canonicalOverride: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
};

const BRAND = " | Lagen Yazılım";

function Counter({ value, min, max }: { value: number; min: number; max: number }) {
  const tone = value === 0 ? "text-ink-soft" : value < min || value > max ? "text-warning" : "text-success";
  return (
    <span className={cn("text-xs tabular-nums", tone)}>
      {value} / {min}–{max}
    </span>
  );
}

/**
 * SEO alanları + canlı SERP ve robots önizlemesi.
 * `pathPrefix` ile slug'dan URL üretilir: "/blog/" + slug + "/".
 */
export function SeoPanel({ initial, pathPrefix, fallbackTitle, siteUrl, slugEditable = true }: { initial: SeoValues; pathPrefix: string; fallbackTitle: string; siteUrl: string; slugEditable?: boolean }) {
  const [slug, setSlug] = useState(initial.slug);
  const [title, setTitle] = useState(initial.seoTitle ?? "");
  const [desc, setDesc] = useState(initial.seoDescription ?? "");
  const [index, setIndex] = useState(initial.robotsIndex);
  const [follow, setFollow] = useState(initial.robotsFollow);
  const slugErr = useFieldError("slug");
  const canonErr = useFieldError("canonicalOverride");

  const shownTitle = (title || fallbackTitle) + ((title || fallbackTitle).includes("Lagen Yazılım") ? "" : BRAND);
  const url = `${siteUrl}${pathPrefix}${slug}${slug ? "/" : ""}`;

  return (
    <div className="grid grid-cols-1 gap-5">
      {slugEditable ? (
        <div className="grid gap-2">
          <label htmlFor="f-slug" className="text-[0.9375rem] font-semibold">
            URL (slug)
          </label>
          <div className="flex items-center overflow-hidden rounded-md border border-line-strong bg-surface focus-within:border-brand">
            <span className="hidden shrink-0 border-r border-line bg-surface-2 px-3 py-3 text-sm text-ink-soft sm:block">{pathPrefix}</span>
            <input
              id="f-slug"
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
              className="h-12 min-w-0 flex-1 bg-transparent px-3 outline-none"
              aria-invalid={!!slugErr}
            />
          </div>
          {slugErr ? (
            <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
              {slugErr}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">Yayındaki bir içeriğin adresini değiştirirseniz eski adres için otomatik 301 yönlendirmesi oluşturulur.</p>
          )}
        </div>
      ) : (
        <input type="hidden" name="slug" value={slug} />
      )}

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="f-seoTitle" className="text-[0.9375rem] font-semibold">
            SEO başlığı
          </label>
          <Counter value={shownTitle.length} min={30} max={60} />
        </div>
        <Input id="f-seoTitle" name="seoTitle" value={title} placeholder={fallbackTitle} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="f-seoDescription" className="text-[0.9375rem] font-semibold">
            Meta açıklama
          </label>
          <Counter value={desc.length} min={120} max={160} />
        </div>
        <Textarea id="f-seoDescription" name="seoDescription" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={320} />
        <p className="text-sm text-ink-soft">Google açıklamayı her zaman göstermeyebilir; sayfadaki metinden kendi özetini de üretebilir.</p>
      </div>

      {/* SERP önizleme */}
      <div className="min-w-0 rounded-md border border-line bg-white p-4 text-[#202124]" aria-label="Arama sonucu önizlemesi">
        <p className="truncate text-xs text-[#4d5156]">{url.replace(/^https?:\/\//, "")}</p>
        <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{shownTitle.length > 62 ? `${shownTitle.slice(0, 60)}…` : shownTitle}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{desc || "Açıklama girilmedi; arama motoru sayfa metninden bir özet seçecek."}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="f-focusKeyword" className="text-[0.9375rem] font-semibold">
            Odak anahtar kelime <span className="font-normal text-ink-soft">(iç kullanım)</span>
          </label>
          <Input id="f-focusKeyword" name="focusKeyword" defaultValue={initial.focusKeyword ?? ""} />
        </div>
        <TagsField name="secondaryKeywords" label="İkincil anahtar kelimeler" initial={initial.secondaryKeywords} />
      </div>

      <div className="grid gap-2">
        <label htmlFor="f-canonicalOverride" className="text-[0.9375rem] font-semibold">
          Canonical değiştirme <span className="font-normal text-ink-soft">(isteğe bağlı)</span>
        </label>
        <Input id="f-canonicalOverride" name="canonicalOverride" defaultValue={initial.canonicalOverride ?? ""} placeholder={url} aria-invalid={!!canonErr} />
        {canonErr ? (
          <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
            {canonErr}
          </p>
        ) : (
          <p className="text-sm text-ink-soft">Boş bırakın: sayfa kendi adresini canonical gösterir. Yalnızca bu sitedeki bir adres girilebilir.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer gap-3">
          <input type="checkbox" name="robotsIndex" value="1" checked={index} onChange={(e) => setIndex(e.target.checked)} className="mt-1 size-[18px] accent-[var(--brand)]" />
          <span className="text-[0.9375rem] font-semibold">Arama motorları dizine eklesin (index)</span>
        </label>
        <label className="flex cursor-pointer gap-3">
          <input type="checkbox" name="robotsFollow" value="1" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="mt-1 size-[18px] accent-[var(--brand)]" />
          <span className="text-[0.9375rem] font-semibold">Bağlantılar izlensin (follow)</span>
        </label>
      </div>
      <p className="rounded-md bg-surface-2/70 px-3 py-2 font-mono text-xs break-words text-ink-muted">
        &lt;meta name=&quot;robots&quot; content=&quot;{index ? "index" : "noindex"}, {follow ? "follow" : "nofollow"}&quot;&gt; · taslak ve arşivdeki içerikler her durumda noindex
      </p>
    </div>
  );
}

export { CheckboxField };
