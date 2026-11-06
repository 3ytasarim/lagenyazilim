"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Field, Input } from "@/components/forms/fields";
import { Button } from "@/components/ui/Button";
import { login, requestPasswordReset, resetPassword, type AuthState } from "@/server/actions/auth";

function Alert({ state }: { state: AuthState }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
        {state.message}
      </p>
    );
  return null;
}

function PasswordInput({ id, name, autoComplete }: { id: string; name: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Parolayı gizle" : "Parolayı göster"}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-soft hover:text-ink"
      >
        {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
      </button>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, null);
  // needTotp: parola doğrulandı, kod bekleniyor. Süre dolarsa sunucu needTotp olmadan döner → parola ekranı.
  if (state?.needTotp)
    return (
      <form action={action} className="grid gap-5">
        <input type="hidden" name="step" value="code" />
        <p className="text-[0.9375rem] text-ink-muted">Kimlik doğrulama uygulamanızdaki 6 haneli kodu girin.</p>
        <Field id="code" label="Doğrulama kodu">
          <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="text-center text-xl tracking-[0.4em] tabular-nums" />
        </Field>
        <Alert state={state.error ? state : null} />
        <Button type="submit" size="lg" disabled={pending} className="w-full">
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null} Doğrula
        </Button>
      </form>
    );
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label="E-posta">
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state?.email} key={state?.email ?? ""} />
      </Field>
      <Field id="password" label="Parola">
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </Field>
      <Alert state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null} Giriş yap
      </Button>
      <Link href="/admin/sifre-sifirla/" className="justify-self-center text-sm font-medium text-brand hover:underline">
        Parolamı unuttum
      </Link>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return (
    <form action={action} className="grid gap-5">
      <Field id="email" label="E-posta">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Alert state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        Sıfırlama bağlantısı gönder
      </Button>
      <Link href="/admin/giris/" className="justify-self-center text-sm font-medium text-brand hover:underline">
        Girişe dön
      </Link>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, null);
  if (state?.message)
    return (
      <div className="grid gap-5">
        <Alert state={state} />
        <Link href="/admin/giris/" className="font-semibold text-brand hover:underline">
          Giriş sayfasına gidin
        </Link>
      </div>
    );
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <Field id="password" label="Yeni parola" hint="En az 12 karakter; harf ve rakam içermeli.">
        <PasswordInput id="password" name="password" autoComplete="new-password" />
      </Field>
      <Field id="confirm" label="Yeni parola (tekrar)">
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" />
      </Field>
      <Alert state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        Parolayı güncelle
      </Button>
    </form>
  );
}
