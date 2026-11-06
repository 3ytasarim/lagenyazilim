"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Pencil, Plus } from "lucide-react";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { StatusBadge } from "@/components/admin/ui";
import { Card } from "@/components/admin/ui";
import { saveRegion } from "@/server/actions/regions";

export type RegionRow = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  parentId: string | null;
  parentName: string | null;
  isVerified: boolean;
  verificationSource: string | null;
  priority: number;
  page: { id: string; status: string; publishedAt: string | null; score: number } | null;
  combos: { id: string; serviceName: string; status: string; score: number }[];
};

const KIND: Record<string, string> = { district: "İlçe", neighborhood: "Mahalle", zone: "Semt / ticari bölge" };

function PageCell({ r }: { r: RegionRow }) {
  if (!r.page)
    return (
      <Link href={`/admin/bolgeler/sayfa/yeni/?bolge=${r.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
        <Plus aria-hidden className="size-3.5" /> Sayfa oluştur
      </Link>
    );
  return (
    <Link href={`/admin/bolgeler/sayfa/${r.page.id}/`} className="inline-flex items-center gap-2 hover:text-brand">
      <StatusBadge status={r.page.status} publishedAt={r.page.publishedAt ? new Date(r.page.publishedAt) : null} />
      <span className={`text-xs tabular-nums ${r.page.score === 100 ? "text-success" : "text-warning"}`}>{r.page.score}/100</span>
    </Link>
  );
}

export function RegionManager({ csrf, rows, districts, services }: { csrf: string; rows: RegionRow[]; districts: { id: string; name: string }[]; services: { id: string; name: string }[] }) {
  const [editing, setEditing] = useState<RegionRow | null>(null);
  const [comboFor, setComboFor] = useState<string>("");
  const [comboService, setComboService] = useState<string>("");
  const dist = rows.filter((r) => r.kind === "district");
  const subs = rows.filter((r) => r.kind !== "district");

  const table = (list: RegionRow[], showParent: boolean) => (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
        <thead className="border-b border-line bg-surface-2/50 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          <tr>
            <th className="px-4 py-3">Bölge</th>
            {showParent ? <th className="px-4 py-3">İlçe</th> : <th className="px-4 py-3">Öncelik</th>}
            <th className="px-4 py-3">Doğrulama</th>
            <th className="px-4 py-3">Genel sayfa</th>
            {!showParent ? <th className="px-4 py-3">Hizmet + ilçe</th> : null}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {list.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="px-4 py-3">
                <span className="font-medium">{r.name}</span>
                <span className="block text-xs text-ink-soft">
                  {KIND[r.kind]} · /{r.slug}/
                </span>
              </td>
              <td className="px-4 py-3 text-sm">{showParent ? r.parentName : r.priority === 1 ? "Öncelikli" : "—"}</td>
              <td className="px-4 py-3 text-sm">
                {r.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 aria-hidden className="size-4" /> Doğrulandı
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-warning">
                    <CircleDashed aria-hidden className="size-4" /> Doğrulanmadı
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <PageCell r={r} />
              </td>
              {!showParent ? (
                <td className="px-4 py-3 text-sm">
                  {r.combos.length ? (
                    <ul className="grid gap-1">
                      {r.combos.map((c) => (
                        <li key={c.id}>
                          <Link href={`/admin/bolgeler/sayfa/${c.id}/`} className="hover:text-brand">
                            {c.serviceName} <span className="text-xs text-ink-soft">({c.score}/100)</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-ink-soft">—</span>
                  )}
                </td>
              ) : null}
              <td className="px-4 py-3">
                <button type="button" aria-label={`${r.name} kaydını düzenle`} onClick={() => setEditing(r)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                  <Pencil aria-hidden className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="grid min-w-0 content-start gap-8">
        <section>
          <h2 className="mb-3 font-semibold">İlçeler (25)</h2>
          {table(dist, false)}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Mahalle, semt ve ticari bölgeler</h2>
          {subs.length ? table(subs, true) : <p className="rounded-lg border border-dashed border-line-strong p-6 text-sm text-ink-muted">Henüz kayıt yok. Resmî kaynaktan doğruladığınız bölgeleri sağdaki formdan ekleyin.</p>}
        </section>
      </div>
      <div className="grid min-w-0 content-start gap-6">
        <Card title="Hizmet + ilçe sayfası" description="Yalnızca gerçek arama talebi ve bölgeye özgü içerik varsa açın; ana hizmet sayfasıyla aynı içeriği tekrar etmemeli.">
          <div className="grid gap-3">
            <select aria-label="İlçe" value={comboFor} onChange={(e) => setComboFor(e.target.value)} className="h-11 rounded-md border border-line-strong bg-surface px-3">
              <option value="">İlçe seçin</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select aria-label="Hizmet" value={comboService} onChange={(e) => setComboService(e.target.value)} className="h-11 rounded-md border border-line-strong bg-surface px-3">
              <option value="">Hizmet seçin</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Link
              aria-disabled={!comboFor || !comboService}
              href={comboFor && comboService ? `/admin/bolgeler/sayfa/yeni/?bolge=${comboFor}&hizmet=${comboService}` : "#"}
              className={`inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold ${comboFor && comboService ? "bg-brand text-on-brand" : "pointer-events-none bg-surface-2 text-ink-soft"}`}
            >
              Taslak oluştur
            </Link>
          </div>
        </Card>
        <Card title={editing ? `Düzenle: ${editing.name}` : "Mahalle / semt ekle"} actions={editing ? <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>Yeni</button> : null}>
          <SaveForm action={saveRegion} csrf={csrf} inline key={editing?.id ?? "new"}>
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            {editing?.kind === "district" ? (
              <>
                <input type="hidden" name="name" value={editing.name} />
                <input type="hidden" name="slug" value={editing.slug} />
                <input type="hidden" name="kind" value="district" />
                <input type="hidden" name="parentId" value={editing.parentId ?? ""} />
                <p className="mb-4 text-sm text-ink-muted">İlçe adı ve adresi sabittir; yalnızca doğrulama bilgisi ve öncelik düzenlenir.</p>
              </>
            ) : (
              <div className="mb-4 grid gap-4">
                <TextField name="name" label="Ad" defaultValue={editing?.name} required />
                <TextField name="slug" label="URL (slug)" defaultValue={editing?.slug} hint="Örn. cukurambar" required />
                <SelectField
                  name="kind"
                  label="Nitelik"
                  options={[
                    { value: "neighborhood", label: "Resmî mahalle" },
                    { value: "zone", label: "Semt / ticari bölge / OSB" },
                  ]}
                  defaultValue={editing?.kind ?? "neighborhood"}
                />
                <SelectField name="parentId" label="Bağlı olduğu ilçe" options={[{ value: "", label: "Seçin" }, ...districts.map((d) => ({ value: d.id, label: d.name }))]} defaultValue={editing?.parentId ?? ""} />
              </div>
            )}
            <div className="grid gap-4">
              <TextAreaField name="verificationSource" label="Doğrulama kaynağı" hint="Belediye mahalle listesi, e-Devlet adres bilgisi, OSB resmî sitesi vb. bağlantı ve tarih." rows={2} defaultValue={editing?.verificationSource ?? ""} optional />
              <CheckboxField name="isVerified" label="Resmî kaynaktan doğrulandı" defaultChecked={editing?.isVerified} />
              <TextField name="priority" label="Öncelik (1 = ilk dalga)" type="number" defaultValue={String(editing?.priority ?? 2)} />
            </div>
          </SaveForm>
        </Card>
      </div>
    </div>
  );
}
