"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { confirmTotpSetup, disableTotp, startTotpSetup } from "@/server/actions/users";

export function TwoFactorCard({ csrf, enabled }: { csrf: string; enabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (enabled)
    return (
      <Card title="İki aşamalı doğrulama" description="Açık. Girişte parolanın yanında doğrulama uygulamasındaki kod istenir.">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-success">
          <ShieldCheck aria-hidden className="size-4" /> Etkin
        </p>
        <SaveForm action={disableTotp} csrf={csrf} inline submitLabel="2FA'yı kapat">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="password" label="Parola" type="password" autoComplete="current-password" />
            <TextField name="code" label="Doğrulama kodu" inputMode="numeric" autoComplete="one-time-code" />
          </div>
        </SaveForm>
      </Card>
    );

  return (
    <Card title="İki aşamalı doğrulama" description="İsteğe bağlı ama önerilir: parolanız ele geçirilse bile hesabınıza giriş yapılamaz. Google Authenticator, Microsoft Authenticator, 1Password vb. uygulamalarla çalışır.">
      {!setup ? (
        <>
          <Button
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("csrf", csrf);
              start(async () => {
                const r = await startTotpSetup(fd);
                if (r.ok && r.data) setSetup(r.data);
                else if (!r.ok) setErr(r.message);
              });
            }}
          >
            Kurulumu başlat
          </Button>
          {err ? <p className="mt-3 text-sm text-danger">{err}</p> : null}
        </>
      ) : (
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setup.qr} alt="Doğrulama uygulaması için QR kodu" width={220} height={220} className="rounded-md border border-line bg-white" />
          <div>
            <ol className="grid list-decimal gap-2 pl-5 text-[0.9375rem] text-ink-muted">
              <li>Doğrulama uygulamasında yeni hesap ekleyip QR kodu okutun.</li>
              <li>
                Okutamıyorsanız anahtarı elle girin: <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs break-all text-ink">{setup.secret.replace(/(.{4})/g, "$1 ").trim()}</code>
              </li>
              <li>Uygulamanın gösterdiği 6 haneli kodu aşağıya yazın.</li>
            </ol>
            <div className="mt-5">
              <SaveForm
                action={async (fd) => {
                  const r = await confirmTotpSetup(fd);
                  if (r.ok) {
                    setSetup(null);
                    router.refresh();
                  }
                  return r;
                }}
                csrf={csrf}
                inline
                submitLabel="Doğrula ve aç"
              >
                <TextField name="code" label="Doğrulama kodu" inputMode="numeric" autoComplete="one-time-code" maxLength={7} />
              </SaveForm>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
