"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { Input, Select } from "@/components/forms/fields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/admin/ui";
import { inviteUser, resetUserTotp, updateUser } from "@/server/actions/users";

const ROLES = [
  { value: "super_admin", label: "Süper yönetici — her şey" },
  { value: "editor", label: "Editör — içerik, medya, SEO" },
  { value: "sales", label: "Satış — teklifler ve başvurular" },
];

type U = { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt: string; self: boolean; twoFactor: boolean };

export function UserManager({ csrf, users }: { csrf: string; users: U[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string; link?: string } | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-[0.9375rem]">
          <thead className="border-b border-line bg-surface-2/50 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-3">Kullanıcı</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Aktif</th>
              <th className="px-4 py-3">Son giriş</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td colSpan={5} className="p-0">
                  <form
                    className="grid grid-cols-[1.4fr_1.2fr_70px_1fr_90px] items-center"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      fd.set("csrf", csrf);
                      fd.set("id", u.id);
                      start(async () => {
                        const r = await updateUser(fd);
                        setMsg({ ok: r.ok, text: r.message ?? "" });
                        router.refresh();
                      });
                    }}
                  >
                    <div className="px-4 py-3">
                      <Input name="name" defaultValue={u.name} aria-label="Ad" className="h-10" />
                      <span className="mt-1 block text-xs text-ink-soft">
                        {u.email} {u.self ? "· siz" : ""} · 2FA {u.twoFactor ? "açık" : "kapalı"}
                        {u.twoFactor && !u.self ? (
                          <button
                            type="button"
                            className="ml-2 text-danger hover:underline"
                            onClick={() => {
                              if (!window.confirm(`${u.name} için 2FA sıfırlansın mı? Kullanıcı tekrar kurmak zorunda kalır.`)) return;
                              const fd = new FormData();
                              fd.set("csrf", csrf);
                              fd.set("id", u.id);
                              start(async () => {
                                const r = await resetUserTotp(fd);
                                setMsg({ ok: r.ok, text: r.message ?? "" });
                                router.refresh();
                              });
                            }}
                          >
                            2FA sıfırla
                          </button>
                        ) : null}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <Select name="role" defaultValue={u.role} aria-label="Rol" className="h-10 text-sm">
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="px-4 py-3">
                      <input type="checkbox" name="isActive" value="1" defaultChecked={u.isActive} aria-label="Aktif" className="size-[18px] accent-[var(--brand)]" />
                    </div>
                    <div className="px-4 py-3 text-sm text-ink-soft">{u.lastLoginAt}</div>
                    <div className="px-4 py-3">
                      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                        Kaydet
                      </Button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card title="Kullanıcı davet et" description="Davet edilen kişi parolasını kendisi belirler; parola kimseyle paylaşılmaz.">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            fd.set("csrf", csrf);
            start(async () => {
              const r = await inviteUser(fd);
              setMsg({ ok: r.ok, text: r.message ?? "", link: r.ok ? r.data?.link : undefined });
              if (r.ok) form.reset();
              router.refresh();
            });
          }}
        >
          <label className="grid gap-2 text-[0.9375rem] font-semibold">
            Ad soyad
            <Input name="name" required />
          </label>
          <label className="grid gap-2 text-[0.9375rem] font-semibold">
            E-posta
            <Input name="email" type="email" required />
          </label>
          <label className="grid gap-2 text-[0.9375rem] font-semibold">
            Rol
            <Select name="role" defaultValue="editor">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" disabled={pending}>
            Davet et
          </Button>
        </form>
        {msg ? (
          <div className={`mt-4 text-sm ${msg.ok ? "text-success" : "text-danger"}`}>
            <p>{msg.text}</p>
            {msg.link ? (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-bg p-2 text-ink">
                <code className="min-w-0 flex-1 truncate text-xs">{msg.link}</code>
                <button type="button" aria-label="Bağlantıyı kopyala" onClick={() => navigator.clipboard.writeText(msg.link!)} className="inline-flex size-8 items-center justify-center rounded hover:bg-surface-2">
                  <Copy aria-hidden className="size-4" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
