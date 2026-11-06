"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { track } from "@/lib/analytics/track";
import { contactSchema, seoAuditSchema, SEO_GOALS, type ContactInput, type SeoAuditInput } from "@/lib/validation/lead";
import { submitContact, submitSeoAudit } from "@/server/actions/lead";
import { Field, Input, Select, Textarea, describedBy } from "./fields";

type Kind = "contact" | "seo_audit";
type Values = ContactInput & SeoAuditInput;

/** İletişim ve ücretsiz SEO analizi formları — aynı bileşen, farklı alan seti. */
export function LeadForm({ kind }: { kind: Kind }) {
  const schema = kind === "contact" ? contactSchema : seoAuditSchema;
  const { register, handleSubmit, formState, setError, setValue } = useForm<Values>({
    resolver: zodResolver(schema as never),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", company: "", subject: "", message: "", website: "", goal: "", kvkk: false as unknown as true, idempotencyKey: "", website2: "" },
  });
  const errors = formState.errors;
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const keyRef = useRef("");

  useEffect(() => {
    keyRef.current = crypto.randomUUID();
    setValue("idempotencyKey", keyRef.current);
  }, [setValue]);

  const onSubmit = handleSubmit((data) => {
    setResult(null);
    startTransition(async () => {
      const res = kind === "contact" ? await submitContact(data) : await submitSeoAudit(data);
      if (res.ok) {
        track(kind === "contact" ? "contact_form_submit" : "seo_audit_submit");
        setResult({ ok: true });
        return;
      }
      if (res.fieldErrors) for (const [k, m] of Object.entries(res.fieldErrors)) setError(k as FieldPath<Values>, { message: m });
      setResult({ ok: false, message: res.message });
    });
  });

  if (result?.ok) {
    return (
      <div role="status" className="rounded-lg border border-line bg-surface p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-10 text-success" />
        <p className="mt-4 text-h3">Mesajınız bize ulaştı</p>
        <p className="mt-2 text-ink-muted">{kind === "seo_audit" ? "Sitenizi inceleyip değerlendirmemizi e-posta ile ileteceğiz." : "En kısa sürede size dönüş yapacağız."}</p>
      </div>
    );
  }

  const p = kind === "contact" ? "c" : "s";
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 rounded-lg border border-line bg-surface p-6 md:p-8">
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor={`${p}-website2`}>Bu alanı boş bırakın</label>
        <input id={`${p}-website2`} tabIndex={-1} autoComplete="off" {...register("website2")} />
      </div>
      <input type="hidden" {...register("idempotencyKey")} />

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id={`${p}-name`} label="Ad soyad" error={errors.name?.message}>
          <Input id={`${p}-name`} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy(`${p}-name`, errors.name?.message)} {...register("name")} />
        </Field>
        <Field id={`${p}-company`} label="Firma" optional>
          <Input id={`${p}-company`} autoComplete="organization" {...register("company")} />
        </Field>
        {kind === "seo_audit" ? (
          <Field id={`${p}-website`} label="Web siteniz" error={errors.website?.message} className="sm:col-span-2">
            <Input id={`${p}-website`} inputMode="url" placeholder="firmaniz.com.tr" aria-invalid={!!errors.website} aria-describedby={describedBy(`${p}-website`, errors.website?.message)} {...register("website")} />
          </Field>
        ) : null}
        <Field id={`${p}-email`} label="E-posta" error={errors.email?.message}>
          <Input id={`${p}-email`} type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby={describedBy(`${p}-email`, errors.email?.message)} {...register("email")} />
        </Field>
        <Field id={`${p}-phone`} label="Telefon" optional error={errors.phone?.message}>
          <Input id={`${p}-phone`} type="tel" autoComplete="tel" inputMode="tel" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        {kind === "seo_audit" ? (
          <Field id={`${p}-goal`} label="En önemli SEO hedefiniz" error={errors.goal?.message} className="sm:col-span-2">
            <Select id={`${p}-goal`} aria-invalid={!!errors.goal} {...register("goal")}>
              <option value="">Seçin</option>
              {SEO_GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field id={`${p}-subject`} label="Konu" optional className="sm:col-span-2">
            <Input id={`${p}-subject`} {...register("subject")} />
          </Field>
        )}
        <Field id={`${p}-message`} label={kind === "seo_audit" ? "Eklemek istedikleriniz" : "Mesajınız"} optional={kind === "seo_audit"} error={errors.message?.message} className="sm:col-span-2">
          <Textarea id={`${p}-message`} rows={5} aria-invalid={!!errors.message} aria-describedby={describedBy(`${p}-message`, errors.message?.message)} {...register("message")} />
        </Field>
      </div>

      <div>
        <label className="flex cursor-pointer gap-3 text-[0.9375rem]">
          <input type="checkbox" className="mt-1 size-[18px] shrink-0 accent-[var(--brand)]" aria-invalid={!!errors.kvkk} {...register("kvkk")} />
          <span>
            <Link href="/kvkk-aydinlatma-metni/" target="_blank" className="font-semibold text-brand hover:underline">
              KVKK Aydınlatma Metni
            </Link>
            &apos;ni okudum; talebimin yanıtlanması amacıyla kişisel verilerimin işleneceğini biliyorum.
          </span>
        </label>
        {errors.kvkk ? (
          <p role="alert" className="mt-2 text-sm font-medium text-danger">
            {errors.kvkk.message}
          </p>
        ) : null}
      </div>

      {result && !result.ok ? (
        <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-4 text-[0.9375rem] text-danger">
          {result.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="justify-self-start">
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {kind === "seo_audit" ? "Ücretsiz analiz isteyin" : "Mesajı gönderin"}
      </Button>
    </form>
  );
}
