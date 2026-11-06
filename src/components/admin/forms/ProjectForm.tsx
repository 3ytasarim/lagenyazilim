"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/fields";
import { MediaDialog, MediaField } from "@/components/admin/MediaPicker";
import { DeleteButton, PublishPanel, RevisionList } from "@/components/admin/PublishPanel";
import { RichTextEditor, type LinkTarget } from "@/components/admin/RichTextEditor";
import { SaveForm, useFieldError } from "@/components/admin/SaveForm";
import { SeoPanel, type SeoValues } from "@/components/admin/SeoPanel";
import { Card } from "@/components/admin/ui";
import type { MediaRef } from "@/lib/media";
import { deleteProject, saveProject } from "@/server/actions/projects";

export type ProjectFormData = {
  id: string | null;
  title: string;
  clientName: string;
  sector: string;
  summary: string;
  challenge: string;
  solution: string;
  results: string;
  body: unknown;
  bodyHtml: string;
  cover: MediaRef | null;
  gallery: MediaRef[];
  liveUrl: string;
  year: string;
  clientConsent: boolean;
  isFeatured: boolean;
  sortOrder: number;
  services: string[];
  seo: SeoValues;
  publish: { status: string; publishedAt: string };
};

function Err({ name }: { name: string }) {
  const e = useFieldError(name);
  return e ? (
    <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
      {e}
    </p>
  ) : null;
}

function Gallery({ csrf, initial }: { csrf: string; initial: MediaRef[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-3">
      <input type="hidden" name="gallery" value={JSON.stringify(items.map((i) => i.id))} />
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => (
          <li key={m.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.variants["480"] ? `/media/${m.variants["480"]}` : m.url} alt="" className="aspect-[4/3] w-full rounded-md bg-surface-2 object-cover" />
            <button type="button" aria-label="Galeriden çıkar" onClick={() => setItems(items.filter((x) => x.id !== m.id))} className="absolute top-1 right-1 inline-flex size-7 items-center justify-center rounded-full bg-deep/70 text-white">
              <X aria-hidden className="size-3.5" />
            </button>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => setOpen(true)} className="flex aspect-[4/3] w-full items-center justify-center rounded-md border border-dashed border-line-strong text-ink-muted hover:border-brand hover:text-brand">
            <ImagePlus aria-hidden className="size-5" />
            <span className="sr-only">Galeriye görsel ekle</span>
          </button>
        </li>
      </ul>
      <MediaDialog csrf={csrf} open={open} onOpenChange={setOpen} onSelect={(m) => !items.some((i) => i.id === m.id) && setItems([...items, m])} />
    </div>
  );
}

export function ProjectForm({ data, csrf, siteUrl, services, linkTargets, revisions }: { data: ProjectFormData; csrf: string; siteUrl: string; services: { id: string; name: string }[]; linkTargets: LinkTarget[]; revisions: { id: string; createdAt: string; note: string | null; author: string | null }[] }) {
  return (
    <SaveForm action={saveProject} csrf={csrf} extraActions={data.id ? <DeleteButton action={deleteProject} csrf={csrf} id={data.id} confirmText="Proje kalıcı olarak silinsin mi?" /> : null}>
      <input type="hidden" name="id" value={data.id ?? ""} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Proje bilgileri">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="title" label="Proje adı" defaultValue={data.title} required />
              <TextField name="clientName" label="Müşteri" defaultValue={data.clientName} required />
              <TextField name="sector" label="Sektör" defaultValue={data.sector} />
              <TextField name="year" label="Yıl" type="number" defaultValue={data.year} optional />
              <TextField name="liveUrl" label="Canlı adres" placeholder="https://" defaultValue={data.liveUrl} optional className="sm:col-span-2" />
              <TextAreaField name="summary" label="Kısa özet" rows={2} defaultValue={data.summary} className="sm:col-span-2" />
            </div>
          </Card>
          <Card title="Vaka analizi">
            <div className="grid gap-5">
              <TextAreaField name="challenge" label="İhtiyaç / sorun" rows={4} defaultValue={data.challenge} />
              <TextAreaField name="solution" label="Çözüm" rows={4} defaultValue={data.solution} />
              <TextAreaField name="results" label="Sonuçlar" hint="Yalnızca müşterinin doğruladığı sonuçlar. Ölçülmemiş rakam yazmayın." rows={3} defaultValue={data.results} optional />
              <div>
                <p className="mb-2 text-[0.9375rem] font-semibold">Ayrıntılı içerik</p>
                <RichTextEditor name="body" csrf={csrf} initialJson={data.body} initialHtml={data.bodyHtml} linkTargets={linkTargets} />
              </div>
            </div>
          </Card>
          <Card title="Galeri">
            <Gallery csrf={csrf} initial={data.gallery} />
          </Card>
          <Card title="SEO">
            <SeoPanel initial={data.seo} pathPrefix="/projeler/" fallbackTitle={data.title || data.clientName || "Proje"} siteUrl={siteUrl} />
          </Card>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Yayın">
            <div className="grid gap-4">
              <PublishPanel status={data.publish.status} publishedAt={data.publish.publishedAt} />
              <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
                <CheckboxField name="clientConsent" label="Müşterinin yazılı yayın izni alındı" hint="Ad, logo ve görsellerin yayımlanması için zorunlu." defaultChecked={data.clientConsent} />
                <Err name="clientConsent" />
              </div>
              <CheckboxField name="isFeatured" label="Ana sayfada öne çıkar" defaultChecked={data.isFeatured} />
              <TextField name="sortOrder" label="Sıra" type="number" defaultValue={String(data.sortOrder)} />
            </div>
          </Card>
          <Card title="Kapak görseli">
            <div className="grid gap-2">
              <MediaField name="coverImageId" label="Görsel" csrf={csrf} initial={data.cover} />
              <Err name="coverImageId" />
            </div>
          </Card>
          <Card title="Sağlanan hizmetler">
            <fieldset className="grid gap-2">
              <legend className="sr-only">Hizmetler</legend>
              {services.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
                  <input type="checkbox" name="servicePick" value={s.id} defaultChecked={data.services.includes(s.id)} className="size-[18px] accent-[var(--brand)]" />
                  {s.name}
                </label>
              ))}
            </fieldset>
          </Card>
          {data.id ? (
            <Card title="Revizyonlar">
              <RevisionList csrf={csrf} items={revisions} />
            </Card>
          ) : null}
        </div>
      </div>
    </SaveForm>
  );
}
