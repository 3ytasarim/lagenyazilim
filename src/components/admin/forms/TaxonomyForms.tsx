"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { CheckboxField, TextAreaField, TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import { deleteTaxonomy, saveAuthor, saveCategory } from "@/server/actions/posts";

function DeleteInline({ csrf, kind, id, label }: { csrf: string; kind: string; id: string; label: string }) {
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
          const res = await deleteTaxonomy(fd);
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
      className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 aria-hidden className="size-4" />
    </button>
  );
}

type Cat = { id: string; name: string; slug: string; description: string | null; sortOrder: number; count: number };

export function CategoryManager({ csrf, categories, tags }: { csrf: string; categories: Cat[]; tags: { id: string; name: string; slug: string; count: number }[] }) {
  const [editing, setEditing] = useState<Cat | null>(null);
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid min-w-0 content-start gap-6">
        <Card title="Kategoriler">
          <ul className="divide-y divide-line">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{c.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">
                    /{c.slug} · {c.count} yazı
                  </span>
                </span>
                <button type="button" aria-label={`${c.name} düzenle`} onClick={() => setEditing(c)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                  <Pencil aria-hidden className="size-4" />
                </button>
                <DeleteInline csrf={csrf} kind="category" id={c.id} label={c.name} />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Etiketler" description="Etiketler yazı düzenlerken otomatik oluşturulur.">
          {tags.length === 0 ? (
            <p className="text-sm text-ink-muted">Etiket yok.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.id} className="inline-flex items-center gap-1 rounded-full border border-line-strong pl-3 text-sm">
                  {t.name} <span className="text-ink-soft">({t.count})</span>
                  <DeleteInline csrf={csrf} kind="tag" id={t.id} label={t.name} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title={editing ? "Kategoriyi düzenle" : "Yeni kategori"} actions={editing ? <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>Yeni</button> : null}>
        <SaveForm action={saveCategory} csrf={csrf} key={editing?.id ?? "new"} inline>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4">
            <TextField name="name" label="Ad" defaultValue={editing?.name} required />
            <TextField name="slug" label="Slug" defaultValue={editing?.slug} hint="Boşsa addan üretilir." />
            <TextAreaField name="description" label="Açıklama" rows={2} defaultValue={editing?.description ?? ""} optional />
            <TextField name="sortOrder" label="Sıra" type="number" defaultValue={String(editing?.sortOrder ?? 0)} />
          </div>
        </SaveForm>
      </Card>
    </div>
  );
}

type Author = { id: string; name: string; slug: string; jobTitle: string | null; bio: string | null; sameAs: string[]; isVerified: boolean; count: number };

export function AuthorManager({ csrf, authors }: { csrf: string; authors: Author[] }) {
  const [editing, setEditing] = useState<Author | null>(null);
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card title="Yazarlar" description="Yalnızca gerçek kişiler eklenmeli. 'Doğrulanmış' işaretli yazarlar için Person şeması üretilir.">
        {authors.length === 0 ? (
          <p className="text-sm text-ink-muted">Yazar yok. Yazılar yazar seçilmezse kurum (Lagen Yazılım) adına yayımlanır.</p>
        ) : (
          <ul className="divide-y divide-line">
            {authors.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{a.name}</span>
                  <span className="ml-2 text-sm text-ink-soft">
                    {a.jobTitle ?? ""} · {a.count} yazı {a.isVerified ? "· doğrulanmış" : ""}
                  </span>
                </span>
                <button type="button" aria-label={`${a.name} düzenle`} onClick={() => setEditing(a)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                  <Pencil aria-hidden className="size-4" />
                </button>
                <DeleteInline csrf={csrf} kind="author" id={a.id} label={a.name} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title={editing ? "Yazarı düzenle" : "Yeni yazar"} actions={editing ? <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>Yeni</button> : null}>
        <SaveForm action={saveAuthor} csrf={csrf} key={editing?.id ?? "new"} inline>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4">
            <TextField name="name" label="Ad soyad" defaultValue={editing?.name} required />
            <TextField name="slug" label="Slug" defaultValue={editing?.slug} />
            <TextField name="jobTitle" label="Unvan" defaultValue={editing?.jobTitle ?? ""} optional />
            <TextAreaField name="bio" label="Kısa biyografi" rows={3} defaultValue={editing?.bio ?? ""} optional />
            <TextAreaField name="sameAs" label="Profil bağlantıları" hint="LinkedIn vb. — her satıra bir https:// adres" rows={2} defaultValue={editing?.sameAs.join("\n") ?? ""} optional />
            <CheckboxField name="isVerified" label="Gerçek kişi, bilgileri doğrulandı" defaultChecked={editing?.isVerified} />
          </div>
        </SaveForm>
      </Card>
    </div>
  );
}
