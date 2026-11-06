"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { PairRepeater, TextAreaField, TextField } from "@/components/admin/fields";
import { DeleteButton, PublishPanel, RevisionList } from "@/components/admin/PublishPanel";
import { RichTextEditor, type LinkTarget } from "@/components/admin/RichTextEditor";
import { SaveForm, useFieldError } from "@/components/admin/SaveForm";
import { SeoPanel, type SeoValues } from "@/components/admin/SeoPanel";
import { Card } from "@/components/admin/ui";
import { deleteRegionPage, saveRegionPage } from "@/server/actions/regions";

export type RegionPageFormData = {
  id: string | null;
  regionId: string;
  serviceId: string | null;
  regionLabel: string;
  path: string;
  title: string;
  h1: string;
  intro: string;
  localNeeds: string;
  localSectors: string;
  serviceModel: string;
  body: unknown;
  bodyHtml: string;
  faqs: { q: string; a: string }[];
  relatedServiceIds: string[];
  score: number;
  report: { key: string; ok: boolean; message: string }[];
  verificationSource: string | null;
  seo: SeoValues;
  publish: { status: string; publishedAt: string };
};

function StatusError() {
  const e = useFieldError("status");
  return e ? (
    <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
      {e}
    </p>
  ) : null;
}

export function RegionPageForm({ data, csrf, siteUrl, services, linkTargets, revisions }: { data: RegionPageFormData; csrf: string; siteUrl: string; services: { id: string; name: string }[]; linkTargets: LinkTarget[]; revisions: { id: string; createdAt: string; note: string | null; author: string | null }[] }) {
  return (
    <SaveForm action={saveRegionPage} csrf={csrf} extraActions={data.id ? <DeleteButton action={deleteRegionPage} csrf={csrf} id={data.id} confirmText="Bölge sayfası silinsin mi?" /> : null}>
      <input type="hidden" name="id" value={data.id ?? ""} />
      <input type="hidden" name="regionId" value={data.regionId} />
      <input type="hidden" name="serviceId" value={data.serviceId ?? ""} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Başlıklar" description={`Adres: ${data.path}`}>
            <div className="grid gap-5">
              <TextField name="title" label="Başlık (iç ad)" defaultValue={data.title} required />
              <TextField name="h1" label="Sayfa başlığı (H1)" hint="Diğer bölge sayfalarıyla aynı kalıpta olmamalı." defaultValue={data.h1} required />
            </div>
          </Card>
          <Card title="Bölgeye özgü içerik" description="Şablon metin değil: bu bölgedeki işletmelerin gerçek ihtiyaçlarını, sektör yapısını ve hizmeti bu bölgeye nasıl verdiğinizi anlatın. Doğrulanmamış rakam veya iddia için [KAYNAK] yazın — işaret kaldırılmadan yayımlanamaz.">
            <div className="grid gap-5">
              <TextAreaField name="intro" label="Kısa giriş (doğrudan cevap)" hint="Bu bölgeye nasıl hizmet veriyorsunuz? Yerinde toplantı, ofise uzaklık, çevrim içi süreç." rows={4} defaultValue={data.intro} />
              <TextAreaField name="localNeeds" label="Bölgedeki işletmelerin ihtiyaçları" rows={6} defaultValue={data.localNeeds} />
              <TextAreaField name="localSectors" label="Yerel sektör yapısı" hint="İş merkezleri, OSB'ler, ticaret bölgeleri — kaynak gösterilebilir bilgi." rows={5} defaultValue={data.localSectors} optional />
              <TextAreaField name="serviceModel" label="Hizmet modeli" rows={4} defaultValue={data.serviceModel} />
              <div>
                <p className="mb-2 text-[0.9375rem] font-semibold">Ek içerik (isteğe bağlı)</p>
                <RichTextEditor name="body" csrf={csrf} initialJson={data.body} initialHtml={data.bodyHtml} linkTargets={linkTargets} />
              </div>
            </div>
          </Card>
          <Card title="Bölgeye özgü SSS" description="En az 3 soru. Genel hizmet sorularını tekrar etmeyin.">
            <PairRepeater name="faqs" label="Sorular" initial={data.faqs.map((f) => ({ title: f.q, text: f.a }))} labels={["Soru", "Cevap"]} addLabel="Soru ekle" />
          </Card>
          <Card title="SEO">
            <SeoPanel initial={data.seo} pathPrefix={data.path.replace(/[^/]+\/$/, "")} fallbackTitle={data.h1 || data.title} siteUrl={siteUrl} slugEditable={false} />
          </Card>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Yayın kapısı" description={`Kalite puanı: ${data.score}/100 — yayın için 100 gerekli. Kontroller her kayıtta yeniden çalışır.`}>
            {data.report.length === 0 ? (
              <p className="text-sm text-ink-muted">Henüz kontrol yapılmadı. Taslağı kaydedin.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {data.report.map((r) => (
                  <li key={r.key} className="flex gap-2">
                    {r.ok ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <XCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />}
                    <span className={r.ok ? "text-ink-muted" : "text-ink"}>{r.message}</span>
                  </li>
                ))}
              </ul>
            )}
            {data.verificationSource ? <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">Bölge kaynağı: {data.verificationSource}</p> : null}
          </Card>
          <Card title="Yayın">
            <div className="grid gap-3">
              <PublishPanel status={data.publish.status} publishedAt={data.publish.publishedAt} publicUrl={data.id && data.publish.status === "published" ? data.path : null} />
              <StatusError />
            </div>
          </Card>
          <Card title="İlgili hizmetler" description={data.serviceId ? "En az 1 ek hizmet." : "En az 2 hizmet."}>
            <fieldset className="grid gap-2">
              <legend className="sr-only">Hizmetler</legend>
              {services.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
                  <input type="checkbox" name="relatedPick" value={s.id} defaultChecked={data.relatedServiceIds.includes(s.id)} className="size-[18px] accent-[var(--brand)]" />
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
