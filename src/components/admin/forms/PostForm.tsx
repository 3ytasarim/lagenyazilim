"use client";

import { PairRepeater, SelectField, TagsField, TextAreaField, TextField } from "@/components/admin/fields";
import { MediaField } from "@/components/admin/MediaPicker";
import { DeleteButton, PublishPanel, RevisionList } from "@/components/admin/PublishPanel";
import { RichTextEditor, type LinkTarget } from "@/components/admin/RichTextEditor";
import { SaveForm, useFieldError } from "@/components/admin/SaveForm";
import { SeoPanel, type SeoValues } from "@/components/admin/SeoPanel";
import { Card } from "@/components/admin/ui";
import type { MediaRef } from "@/lib/media";
import { deletePost, savePost } from "@/server/actions/posts";

export type PostFormData = {
  id: string | null;
  title: string;
  excerpt: string;
  body: unknown;
  bodyHtml: string;
  cover: MediaRef | null;
  ogImage: MediaRef | null;
  authorId: string;
  categoryId: string;
  tags: string[];
  sources: { title: string; url: string }[];
  seo: SeoValues;
  publish: { status: string; publishedAt: string };
};

function BodyError() {
  const e = useFieldError("body");
  return e ? (
    <p role="alert" data-field-error="" className="mt-3 text-sm font-medium text-danger">
      {e}
    </p>
  ) : null;
}
function CoverError() {
  const e = useFieldError("coverImageId");
  return e ? (
    <p role="alert" data-field-error="" className="text-sm font-medium text-danger">
      {e}
    </p>
  ) : null;
}

export function PostForm({
  data,
  csrf,
  siteUrl,
  authors,
  categories,
  tagSuggestions,
  linkTargets,
  revisions,
}: {
  data: PostFormData;
  csrf: string;
  siteUrl: string;
  authors: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  tagSuggestions: string[];
  linkTargets: LinkTarget[];
  revisions: { id: string; createdAt: string; note: string | null; author: string | null }[];
}) {
  return (
    <SaveForm action={savePost} csrf={csrf} extraActions={data.id ? <DeleteButton action={deletePost} csrf={csrf} id={data.id} confirmText="Yazı kalıcı olarak silinsin mi?" /> : null}>
      <input type="hidden" name="id" value={data.id ?? ""} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <div className="grid gap-5">
              <TextField name="title" label="Başlık" defaultValue={data.title} className="[&_input]:text-lg" required />
              <TextAreaField name="excerpt" label="Özet" hint="Liste kartlarında ve yazının girişinde görünür (1–2 cümle)." rows={2} defaultValue={data.excerpt} />
            </div>
          </Card>
          <Card title="İçerik" description="H2/H3 başlıkları otomatik içindekiler tablosuna ve bağlantı çapalarına dönüşür.">
            <RichTextEditor name="body" csrf={csrf} initialJson={data.body} initialHtml={data.bodyHtml} linkTargets={linkTargets} />
            <BodyError />
          </Card>
          <Card title="Kaynaklar ve referanslar" description="İddiaları destekleyen dış kaynaklar yazının sonunda listelenir.">
            <PairRepeater name="sources" label="Kaynaklar" initial={data.sources.map((s) => ({ title: s.title, text: s.url }))} labels={["Kaynak adı", "https://…"]} addLabel="Kaynak ekle" />
          </Card>
          <Card title="SEO">
            <div className="grid gap-6">
              <SeoPanel initial={data.seo} pathPrefix="/blog/" fallbackTitle={data.title || "Yazı başlığı"} siteUrl={siteUrl} />
              <MediaField name="ogImageId" label="Paylaşım (OG) görseli" csrf={csrf} initial={data.ogImage} hint="Boşsa kapak görseli, o da yoksa site varsayılanı kullanılır." />
            </div>
          </Card>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Yayın">
            <PublishPanel status={data.publish.status} publishedAt={data.publish.publishedAt} publicUrl={data.id && data.publish.status === "published" ? `/blog/${data.seo.slug}/` : null} />
          </Card>
          <Card title="Sınıflandırma">
            <div className="grid gap-5">
              <SelectField name="categoryId" label="Kategori" options={[{ value: "", label: "Seçilmedi" }, ...categories]} defaultValue={data.categoryId} />
              <SelectField name="authorId" label="Yazar" options={[{ value: "", label: "Lagen Yazılım (kurum)" }, ...authors]} defaultValue={data.authorId} hint="Kişi şeması yalnızca doğrulanmış yazarlar için üretilir." />
              <TagsField name="tags" label="Etiketler" initial={data.tags} suggestions={tagSuggestions} />
            </div>
          </Card>
          <Card title="Kapak görseli">
            <div className="grid gap-2">
              <MediaField name="coverImageId" label="Görsel" csrf={csrf} initial={data.cover} />
              <CoverError />
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
