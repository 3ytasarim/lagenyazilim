"use client";

import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaPicker";
import { PublishPanel, RevisionList } from "@/components/admin/PublishPanel";
import { RichTextEditor, type LinkTarget } from "@/components/admin/RichTextEditor";
import { SaveForm } from "@/components/admin/SaveForm";
import { SeoPanel, type SeoValues } from "@/components/admin/SeoPanel";
import { Card } from "@/components/admin/ui";
import type { MediaRef } from "@/lib/media";
import { savePage } from "@/server/actions/pages";

export type PageFormData = {
  id: string | null;
  title: string;
  h1: string;
  excerpt: string;
  kind: string;
  requiresLegalReview: boolean;
  version: string;
  body: unknown;
  bodyHtml: string;
  /** Şablonu kodda olan sayfalarda gövde düzenlenmez (ör. Hakkımızda: başlık, giriş ve SEO). */
  hasBody: boolean;
  slugLocked: boolean;
  ogImage: MediaRef | null;
  seo: SeoValues;
  publish: { status: string; publishedAt: string };
};

export function PageForm({ data, csrf, siteUrl, linkTargets, revisions }: { data: PageFormData; csrf: string; siteUrl: string; linkTargets: LinkTarget[]; revisions: { id: string; createdAt: string; note: string | null; author: string | null }[] }) {
  return (
    <SaveForm action={savePage} csrf={csrf}>
      <input type="hidden" name="id" value={data.id ?? ""} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <div className="grid gap-5">
              <TextField name="title" label="Başlık" defaultValue={data.title} required />
              <TextField name="h1" label="Sayfa başlığı (H1)" hint="Boşsa başlık kullanılır." defaultValue={data.h1} optional />
              <TextAreaField name="excerpt" label="Giriş / özet" rows={3} defaultValue={data.excerpt} optional />
            </div>
          </Card>
          {data.hasBody ? (
            <Card title="İçerik">
              <RichTextEditor name="body" csrf={csrf} initialJson={data.body} initialHtml={data.bodyHtml} linkTargets={linkTargets} />
            </Card>
          ) : (
            <p className="rounded-md border border-line bg-surface p-4 text-sm text-ink-muted">Bu sayfanın düzeni sitede özel olarak tasarlandı; buradan başlık, giriş metni ve SEO ayarları yönetilir.</p>
          )}
          <Card title="SEO">
            <div className="grid gap-6">
              <SeoPanel initial={data.seo} pathPrefix="/" fallbackTitle={data.title} siteUrl={siteUrl} slugEditable={!data.slugLocked} />
              <MediaField name="ogImageId" label="Paylaşım (OG) görseli" csrf={csrf} initial={data.ogImage} />
            </div>
          </Card>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Yayın">
            <PublishPanel status={data.publish.status} publishedAt={data.publish.publishedAt} publicUrl={data.id && data.publish.status === "published" ? `/${data.seo.slug}/` : null} />
          </Card>
          <Card title="Tür">
            <div className="grid gap-4">
              <SelectField
                name="kind"
                label="Sayfa türü"
                options={[
                  { value: "corporate", label: "Kurumsal" },
                  { value: "legal", label: "Yasal metin" },
                ]}
                defaultValue={data.kind}
              />
              <CheckboxField name="requiresLegalReview" label="Hukuki onay bekliyor" hint="Sitede uyarı bandı gösterilir; yasal metin indekslenmez." defaultChecked={data.requiresLegalReview} />
              <TextField name="version" label="Sürüm" defaultValue={data.version} optional />
            </div>
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
