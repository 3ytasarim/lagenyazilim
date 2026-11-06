"use client";

import { CheckboxField, PairRepeater, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { DeleteButton, PublishPanel, RevisionList } from "@/components/admin/PublishPanel";
import { RichTextEditor, type LinkTarget } from "@/components/admin/RichTextEditor";
import { SaveForm, useFieldError } from "@/components/admin/SaveForm";
import { SeoPanel, type SeoValues } from "@/components/admin/SeoPanel";
import { Card } from "@/components/admin/ui";
import { deleteService, saveService } from "@/server/actions/services";

export type ServiceFormData = {
  id: string | null;
  name: string;
  shortName: string;
  h1: string;
  summary: string;
  heroText: string;
  shortAnswer: string;
  icon: string;
  problem: string;
  approach: string;
  scope: { title: string; text: string }[];
  deliverables: string[];
  sectors: string[];
  process: { title: string; text: string }[];
  faqs: { q: string; a: string }[];
  quoteKey: string | null;
  isCore: boolean;
  sortOrder: number;
  body: unknown;
  bodyHtml: string;
  related: string[];
  seo: SeoValues;
  publish: { status: string; publishedAt: string };
};

const ICONS = [
  { value: "layout", label: "Sayfa düzeni" },
  { value: "search", label: "Arama" },
  { value: "share", label: "Paylaşım" },
  { value: "code", label: "Kod" },
  { value: "book", label: "Katalog" },
  { value: "camera", label: "Kamera" },
  { value: "cart", label: "Alışveriş" },
  { value: "sparkles", label: "Yapay zekâ" },
];

function ApprovalField({ isCore }: { isCore: boolean }) {
  const err = useFieldError("approvedOffer");
  if (isCore) return null;
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 p-3">
      <CheckboxField name="approvedOffer" label="Firma bu hizmeti sunduğunu onayladı" hint="Öneri niteliğindeki hizmetler bu onay olmadan yayımlanamaz." />
      {err ? (
        <p role="alert" data-field-error="" className="mt-2 text-sm font-medium text-danger">
          {err}
        </p>
      ) : null}
    </div>
  );
}

export function ServiceForm({
  data,
  csrf,
  siteUrl,
  otherServices,
  quoteOptions,
  linkTargets,
  revisions,
}: {
  data: ServiceFormData;
  csrf: string;
  siteUrl: string;
  otherServices: { id: string; name: string }[];
  quoteOptions: { value: string; label: string }[];
  linkTargets: LinkTarget[];
  revisions: { id: string; createdAt: string; note: string | null; author: string | null }[];
}) {
  return (
    <SaveForm
      action={saveService}
      csrf={csrf}
      extraActions={data.id ? <DeleteButton action={deleteService} csrf={csrf} id={data.id} confirmText="Hizmet kalıcı olarak silinsin mi?" /> : null}
    >
      <input type="hidden" name="id" value={data.id ?? ""} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Temel bilgiler">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField name="name" label="Hizmet adı" defaultValue={data.name} required />
              <TextField name="shortName" label="Kısa ad" hint="Menü ve kartlarda" defaultValue={data.shortName} />
              <TextField name="h1" label="Sayfa başlığı (H1)" defaultValue={data.h1} className="sm:col-span-2" required />
              <TextAreaField name="summary" label="Kısa açıklama" hint="Kartlarda ve mega menüde görünür (1–2 cümle)." rows={2} defaultValue={data.summary} className="sm:col-span-2" />
              <TextAreaField name="heroText" label="Giriş metni" rows={3} defaultValue={data.heroText} className="sm:col-span-2" />
              <TextAreaField
                name="shortAnswer"
                label="Kısa cevap paragrafı"
                hint="Sayfanın başında 'Kısaca' kutusunda görünür. Bu hizmet nedir, kime uygun, neyi kapsar — 40–80 kelime. Yapay zekâ destekli aramalar bu tür net özetleri tercih eder."
                rows={4}
                defaultValue={data.shortAnswer}
                className="sm:col-span-2"
              />
            </div>
          </Card>

          <Card title="İhtiyaç ve yaklaşım">
            <div className="grid gap-5">
              <TextAreaField name="problem" label="Sık karşılaşılan sorun" rows={4} defaultValue={data.problem} />
              <TextAreaField name="approach" label="Çözüm yaklaşımımız" rows={4} defaultValue={data.approach} />
            </div>
          </Card>

          <Card title="Kapsam, teslimler ve süreç">
            <div className="grid gap-8">
              <PairRepeater name="scope" label="Hizmet kapsamı" initial={data.scope} />
              <TagsField name="deliverables" label="Teslim edilenler" initial={data.deliverables} hint="Enter veya virgül ile ekleyin." />
              <TagsField name="sectors" label="Sık çalışılan sektörler" initial={data.sectors} />
              <PairRepeater name="process" label="Çalışma süreci adımları" initial={data.process} addLabel="Adım ekle" />
            </div>
          </Card>

          <Card title="Sık sorulan sorular" description="Yalnızca sayfada görünen sorular FAQ şemasına eklenir.">
            <PairRepeater name="faqs" label="Sorular" initial={data.faqs.map((f) => ({ title: f.q, text: f.a }))} labels={["Soru", "Cevap"]} addLabel="Soru ekle" />
          </Card>

          <Card title="Ek içerik (isteğe bağlı)" description="Hizmet sayfasının altına eklenecek serbest içerik.">
            <RichTextEditor name="body" csrf={csrf} initialJson={data.body} initialHtml={data.bodyHtml} linkTargets={linkTargets} />
          </Card>

          <Card title="SEO">
            <SeoPanel initial={data.seo} pathPrefix="/" fallbackTitle={data.h1 || data.name} siteUrl={siteUrl} />
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card title="Yayın">
            <div className="grid gap-4">
              <PublishPanel status={data.publish.status} publishedAt={data.publish.publishedAt} publicUrl={data.id && data.publish.status === "published" ? `/${data.seo.slug}/` : null} />
              <ApprovalField isCore={data.isCore} />
            </div>
          </Card>
          <Card title="Görünüm">
            <div className="grid gap-5">
              <SelectField name="icon" label="İkon" options={ICONS} defaultValue={data.icon} />
              <TextField name="sortOrder" label="Sıra" type="number" defaultValue={String(data.sortOrder)} />
              <SelectField name="quoteKey" label="Teklif formunda ön seçim" options={[{ value: "", label: "Yok" }, ...quoteOptions]} defaultValue={data.quoteKey ?? ""} />
              <CheckboxField name="isCore" label="Ana hizmet" hint="İşaretsizse 'yeni hizmet önerisi' sayılır." defaultChecked={data.isCore} />
            </div>
          </Card>
          <Card title="İlgili hizmetler" description="Sayfanın altında ve iç bağlantılarda kullanılır (en fazla 6).">
            <RelatedPicker initial={data.related} options={otherServices} />
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

function RelatedPicker({ initial, options }: { initial: string[]; options: { id: string; name: string }[] }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">İlgili hizmetler</legend>
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-3 text-[0.9375rem]">
          <input type="checkbox" name="relatedPick" value={o.id} defaultChecked={initial.includes(o.id)} className="size-[18px] accent-[var(--brand)]" />
          {o.name}
        </label>
      ))}
    </fieldset>
  );
}
