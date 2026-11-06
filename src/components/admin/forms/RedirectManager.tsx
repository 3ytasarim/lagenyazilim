"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { CheckboxField, SelectField, TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import { deleteRedirect, saveRedirect } from "@/server/actions/redirects";

type R = { id: string; fromPath: string; toPath: string; statusCode: number; isActive: boolean; hits: number; lastHitAt: string; note: string | null };

export function RedirectManager({ csrf, rules }: { csrf: string; rules: R[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<R | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
          <thead className="border-b border-line bg-surface-2/50 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Eski adres</th>
              <th className="px-4 py-3">Hedef</th>
              <th className="px-4 py-3">Kod</th>
              <th className="px-4 py-3">İsabet</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  Kayıt yok. Eski WordPress adresleri kod içinde tanımlı (docs/redirect-map.csv); buradaki kurallar ek ve sonradan oluşan yönlendirmeler içindir.
                </td>
              </tr>
            ) : null}
            {rules.map((r) => (
              <tr key={r.id} className={r.isActive ? "" : "opacity-50"}>
                <td className="px-4 py-3 font-mono text-sm break-all">{r.fromPath}</td>
                <td className="px-4 py-3 font-mono text-sm break-all">{r.statusCode === 410 ? "—" : r.toPath}</td>
                <td className="px-4 py-3 text-sm">{r.statusCode}</td>
                <td className="px-4 py-3 text-sm text-ink-soft">
                  {r.hits} <span className="block text-xs">{r.lastHitAt}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex">
                    <button type="button" aria-label="Düzenle" onClick={() => setEditing(r)} className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink">
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Sil"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`${r.fromPath} kuralı silinsin mi?`)) return;
                        const fd = new FormData();
                        fd.set("csrf", csrf);
                        fd.set("id", r.id);
                        start(async () => {
                          const res = await deleteRedirect(fd);
                          if (!res.ok) window.alert(res.message);
                          router.refresh();
                        });
                      }}
                      className="inline-flex size-9 items-center justify-center rounded-md text-ink-soft hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Card title={editing ? "Kuralı düzenle" : "Yeni yönlendirme"} actions={editing ? <button type="button" className="text-sm text-brand" onClick={() => setEditing(null)}>Yeni</button> : null}>
        <SaveForm action={saveRedirect} csrf={csrf} inline key={editing?.id ?? "new"}>
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <div className="grid gap-4">
            <TextField name="fromPath" label="Eski adres" placeholder="/eski-sayfa/" defaultValue={editing?.fromPath} required />
            <TextField name="toPath" label="Hedef" placeholder="/yeni-sayfa/" hint="Yalnızca site içi adres. 410 seçiliyse boş bırakın." defaultValue={editing?.toPath} />
            <SelectField
              name="statusCode"
              label="Tür"
              options={[
                { value: "301", label: "301 — kalıcı taşındı" },
                { value: "308", label: "308 — kalıcı (yöntem korunur)" },
                { value: "302", label: "302 — geçici" },
                { value: "410", label: "410 — kalıcı olarak kaldırıldı" },
              ]}
              defaultValue={String(editing?.statusCode ?? 301)}
            />
            <TextField name="note" label="Not" defaultValue={editing?.note ?? ""} optional />
            <CheckboxField name="isActive" label="Etkin" defaultChecked={editing?.isActive ?? true} />
          </div>
        </SaveForm>
      </Card>
    </div>
  );
}
