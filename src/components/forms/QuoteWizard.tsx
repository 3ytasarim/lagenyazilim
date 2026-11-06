"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Loader2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CONTACT_METHODS, PRIORITIES, START_TIMINGS, type QuoteServiceOption } from "@/content/quote";
import { track } from "@/lib/analytics/track";
import { cn, formatBytes } from "@/lib/utils";
import { QUOTE_FILES, QUOTE_STEP_FIELDS, quoteFormSchema, validateQuoteFile, type QuoteFormValues } from "@/lib/validation/quote";
import { submitQuote } from "@/server/actions/quote";
import { ChoiceCard, Field, Input, Select, Textarea, describedBy } from "./fields";

const STEPS = ["Hizmet", "Proje", "Bütçe ve takvim", "İletişim", "Onay"] as const;
const DRAFT_KEY = "lagen-quote-draft-v1";

const DEFAULTS: QuoteFormValues = {
  services: [],
  companyName: "",
  projectName: "",
  currentWebsite: "",
  sector: "",
  goal: "",
  needs: "",
  features: "",
  referenceSites: "",
  extra: {},
  budget: "",
  startTiming: "",
  targetDate: "",
  priority: "",
  contactName: "",
  email: "",
  phone: "",
  contactCompany: "",
  location: "",
  preferredContact: "email",
  kvkk: false as unknown as true,
  explicitConsent: false,
};

type Props = {
  options: QuoteServiceOption[];
  budgets: { id: string; label: string }[];
  locations: string[];
  /** "modal": açılır pencere düzeni (adımlar yatay, kaydırma pencere içinde) */
  variant?: "page" | "modal";
  /** Açılır pencerede ön seçili hizmet (sayfada ?hizmet= okunur) */
  preselect?: string | null;
  onClose?: () => void;
  /** Açılır pencerede sol panelin başlığı */
  header?: React.ReactNode;
};

export function QuoteWizard({ options, budgets, locations, variant = "page", preselect, onClose, header }: Props) {
  const modal = variant === "modal";
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollTop = () => {
    const box = rootRef.current?.closest<HTMLElement>("[data-scroll-root]");
    if (box) box.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{ number: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const meta = useRef({ idempotencyKey: "", startedAt: 0 });

  const form = useForm<QuoteFormValues>({ resolver: zodResolver(quoteFormSchema), defaultValues: DEFAULTS, mode: "onTouched" });
  const { register, handleSubmit, trigger, formState, control, reset, getValues, setError } = form;
  const errors = formState.errors;
  const selected = useWatch({ control, name: "services" });
  const values = useWatch({ control });

  // Taslak geri yükleme + URL'deki ?hizmet= ön seçimi
  useEffect(() => {
    meta.current = { idempotencyKey: crypto.randomUUID(), startedAt: Date.now() };
    let draft: Partial<QuoteFormValues> | null = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    } catch {
      draft = null;
    }
    const pre = modal ? (preselect ?? null) : new URLSearchParams(window.location.search).get("hizmet");
    const base = { ...DEFAULTS, ...(draft ?? {}), kvkk: DEFAULTS.kvkk };
    if (pre && options.some((o) => o.key === pre) && !base.services.includes(pre)) base.services = [...base.services, pre];
    reset(base);
  }, [options, reset, modal, preselect]);

  // Taslağı sakla (onay kutuları hariç)
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      try {
        const rest: Partial<QuoteFormValues> = { ...getValues() };
        delete rest.kvkk;
        delete rest.explicitConsent;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
      } catch {
        /* depolama kapalı olabilir */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [values, done, getValues]);

  // Odak yalnızca adım değişince başlığa taşınır; ilk yüklemede sayfanın doğal odak sırası korunur
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const extraFields = useMemo(() => options.filter((o) => selected?.includes(o.key)).flatMap((o) => o.extraFields.map((f) => ({ ...f, service: o.label }))), [options, selected]);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    track("quote_form_start");
  }

  async function next() {
    const ok = await trigger(QUOTE_STEP_FIELDS[step] as FieldPath<QuoteFormValues>[], { shouldFocus: true });
    if (!ok) return;
    track("quote_form_step", { step: step + 2 });
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFileError(null);
    const incoming = Array.from(list);
    const merged = [...files, ...incoming];
    if (merged.length > QUOTE_FILES.maxFiles) {
      setFileError(`En fazla ${QUOTE_FILES.maxFiles} dosya ekleyebilirsiniz.`);
      return;
    }
    for (const f of incoming) {
      const err = validateQuoteFile(f);
      if (err) {
        setFileError(err);
        return;
      }
    }
    setFiles(merged);
  }

  function onValid(data: QuoteFormValues) {
    setSubmitError(null);
    const fd = new FormData();
    const honeypot = (document.getElementById("q-website2") as HTMLInputElement | null)?.value ?? "";
    // Yalnızca seçili hizmetlerin ek soruları ve dolu cevaplar gönderilir
    const allowed = new Set(extraFields.map((f) => f.key));
    const extra = Object.fromEntries(
      Object.entries(data.extra).filter(([k, val]) => allowed.has(k) && val !== false && !(Array.isArray(val) && val.length === 0) && val !== ""),
    );
    fd.set("payload", JSON.stringify({ ...data, extra, ...meta.current, website2: honeypot }));
    files.forEach((f) => fd.append("files", f));
    startTransition(async () => {
      const res = await submitQuote(fd);
      if (res.ok) {
        track("quote_form_submit", { services: data.services.join(",") });
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* yok say */
        }
        setDone({ number: res.number });
        scrollTop();
        return;
      }
      if (res.fieldErrors) {
        for (const [k, msg] of Object.entries(res.fieldErrors)) setError(k as FieldPath<QuoteFormValues>, { message: msg });
      }
      setSubmitError(res.message);
    });
  }

  if (done) {
    return (
      <div ref={rootRef} role="status" className={modal ? "step-in flex h-full flex-col items-center justify-center p-8 text-center md:p-14" : "rounded-lg border border-line bg-surface p-8 text-center md:p-14"}>
        <CheckCircle2 aria-hidden className="mx-auto size-12 text-success" />
        <h2 className="mt-6 text-h2">Talebiniz bize ulaştı</h2>
        <p className="mx-auto mt-4 max-w-[48ch] text-ink-muted">
          Teklif numaranız <strong className="text-ink">{done.number}</strong>. Ekibimiz talebinizi inceleyip tercih ettiğiniz iletişim yöntemiyle size dönecek.
        </p>
        {modal && onClose ? (
          <button type="button" onClick={onClose} className="mt-8 inline-flex font-semibold text-brand hover:underline">
            Pencereyi kapatın
          </button>
        ) : (
          <Link href="/" className="mt-8 inline-flex font-semibold text-brand hover:underline">
            Ana sayfaya dönün
          </Link>
        )}
      </div>
    );
  }

  const v = values as QuoteFormValues;
  const optionLabel = (key: string) => options.find((o) => o.key === key)?.label ?? key;

  const stepList = modal ? (
    <ol className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] md:grid md:gap-1 md:overflow-visible">
      {STEPS.map((label, i) => (
        <li key={label} className="shrink-0">
          <span
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full px-2 py-1.5 text-sm transition-colors duration-300 md:rounded-xl md:px-3.5 md:py-3",
              i === step ? "bg-white/10 pr-4 font-semibold text-white" : i < step ? "text-on-deep" : "text-on-deep-muted",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors duration-300",
                i < step ? "bg-brand-cyan text-deep" : i === step ? "bg-white text-deep" : "border border-white/20 text-on-deep-muted",
              )}
            >
              {i < step ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={i === step ? "" : "max-md:sr-only"}>{label}</span>
          </span>
        </li>
      ))}
    </ol>
  ) : (
    <ol className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:grid lg:gap-0 lg:overflow-visible">
      {STEPS.map((label, i) => (
        <li key={label} className="shrink-0 lg:shrink">
          <span
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full border px-3 py-2 text-sm lg:rounded-none lg:border-0 lg:border-l-2 lg:px-5 lg:py-3.5 lg:text-[0.9375rem]",
              i === step ? "border-brand font-semibold text-ink" : i < step ? "border-line text-ink-muted lg:border-brand/40" : "border-line text-ink-soft",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                i < step ? "bg-brand text-on-brand" : i === step ? "bg-ink text-bg" : "bg-surface-2 text-ink-soft",
              )}
            >
              {i + 1}
            </span>
            {label}
          </span>
        </li>
      ))}
    </ol>
  );

  const formEl = (
      <form onSubmit={(e) => void handleSubmit(onValid)(e)} onFocusCapture={markStarted} noValidate className={modal ? "min-w-0" : "min-w-0 lg:col-span-8"}>
        {/* Bot tuzağı */}
        <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
          <label htmlFor="q-website2">Bu alanı boş bırakın</label>
          <input id="q-website2" name="website2" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className={modal ? "flex min-h-full flex-col" : "rounded-lg border border-line bg-surface p-6 md:p-10"}>
          <div className={modal ? "flex-1 px-5 pt-6 pb-8 md:px-10 md:pt-9" : ""}>
          <p className="text-sm text-ink-soft">
            Adım {step + 1} / {STEPS.length}
          </p>
          <h2 ref={headingRef} tabIndex={-1} className={modal ? "mt-1.5 scroll-mt-6 font-display text-2xl font-semibold tracking-tight outline-none md:text-[1.75rem]" : "mt-2 text-h2 outline-none"}>
            {["Hangi hizmetlerle ilgileniyorsunuz?", "Projenizden bahsedin", "Bütçe ve takvim", "Size nasıl ulaşalım?", "Kontrol edin ve gönderin"][step]}
          </h2>

          <div key={step} className={modal ? "step-in mt-6" : "mt-8"}>
            {step === 0 ? (
              <fieldset>
                <legend className="sr-only">Hizmetler</legend>
                <p className="mb-5 text-ink-muted">Birden fazla seçebilirsiniz.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {options.map((o) => (
                    <ChoiceCard key={o.key} type="checkbox" value={o.key} label={o.label} description={o.description} {...register("services")} />
                  ))}
                </div>
                {errors.services ? (
                  <p role="alert" className="mt-4 text-sm font-medium text-danger">
                    {errors.services.message}
                  </p>
                ) : null}
              </fieldset>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="q-company" label="Firma adı" optional error={errors.companyName?.message}>
                    <Input id="q-company" autoComplete="organization" {...register("companyName")} />
                  </Field>
                  <Field id="q-project" label="Proje adı" optional error={errors.projectName?.message}>
                    <Input id="q-project" {...register("projectName")} />
                  </Field>
                  <Field id="q-site" label="Mevcut web siteniz" optional error={errors.currentWebsite?.message}>
                    <Input id="q-site" inputMode="url" placeholder="firmaniz.com.tr" aria-invalid={!!errors.currentWebsite} aria-describedby={describedBy("q-site", errors.currentWebsite?.message)} {...register("currentWebsite")} />
                  </Field>
                  <Field id="q-sector" label="Sektör" optional error={errors.sector?.message}>
                    <Input id="q-sector" placeholder="Örn. makine imalatı" {...register("sector")} />
                  </Field>
                </div>
                <Field id="q-goal" label="Projenin amacı" optional hint="Bu projeyle neyin değişmesini istiyorsunuz?" error={errors.goal?.message}>
                  <Input id="q-goal" aria-describedby={describedBy("q-goal", errors.goal?.message, "x")} {...register("goal")} />
                </Field>
                <Field id="q-needs" label="İhtiyacınızı anlatın" error={errors.needs?.message}>
                  <Textarea id="q-needs" rows={6} aria-invalid={!!errors.needs} aria-describedby={describedBy("q-needs", errors.needs?.message)} {...register("needs")} />
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="q-features" label="İstediğiniz özellikler" optional error={errors.features?.message}>
                    <Textarea id="q-features" rows={3} {...register("features")} />
                  </Field>
                  <Field id="q-refs" label="Beğendiğiniz örnek siteler" optional error={errors.referenceSites?.message}>
                    <Textarea id="q-refs" rows={3} placeholder="Her satıra bir adres" {...register("referenceSites")} />
                  </Field>
                </div>

                {extraFields.length > 0 ? (
                  <fieldset className="grid gap-6 border-t border-line pt-8">
                    <legend className="mb-2 font-display text-h3">Seçtiğiniz hizmetlere özel sorular</legend>
                    {extraFields.map((f) => {
                      const id = `q-extra-${f.key}`;
                      const name = `extra.${f.key}` as FieldPath<QuoteFormValues>;
                      if (f.type === "multiselect") {
                        return (
                          <fieldset key={f.key}>
                            <legend className="mb-3 text-[0.9375rem] font-semibold">
                              {f.label} <span className="font-normal text-ink-soft">· {f.service}</span>
                            </legend>
                            <div className="flex flex-wrap gap-2">
                              {f.options?.map((opt) => (
                                <label key={opt} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-4 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-tint">
                                  <input type="checkbox" value={opt} className="accent-[var(--brand)]" {...register(name)} />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        );
                      }
                      return (
                        <Field key={f.key} id={id} label={`${f.label}`} optional hint={f.service}>
                          {f.type === "select" ? (
                            <Select id={id} {...register(name)}>
                              <option value="">Seçin</option>
                              {f.options?.map((opt) => (
                                <option key={opt}>{opt}</option>
                              ))}
                            </Select>
                          ) : f.type === "textarea" ? (
                            <Textarea id={id} rows={3} placeholder={f.placeholder} {...register(name)} />
                          ) : (
                            <Input id={id} placeholder={f.placeholder} {...register(name)} />
                          )}
                        </Field>
                      );
                    })}
                  </fieldset>
                ) : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-8">
                <fieldset>
                  <legend className="mb-4 text-[0.9375rem] font-semibold">Tahmini bütçe aralığı</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {budgets.map((b) => (
                      <ChoiceCard key={b.id} type="radio" value={b.id} label={b.label} {...register("budget")} />
                    ))}
                  </div>
                  {errors.budget ? (
                    <p role="alert" className="mt-3 text-sm font-medium text-danger">
                      {errors.budget.message}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm text-ink-soft">Bütçe bilgisi kapsamı doğru önermemize yardımcı olur; kesin fiyat teklif aşamasında yazılı olarak verilir.</p>
                </fieldset>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field id="q-start" label="Ne zaman başlamak istiyorsunuz?" error={errors.startTiming?.message}>
                    <Select id="q-start" aria-invalid={!!errors.startTiming} {...register("startTiming")}>
                      <option value="">Seçin</option>
                      {START_TIMINGS.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="q-target" label="Hedef tamamlanma tarihi" optional error={errors.targetDate?.message}>
                    <Input id="q-target" type="month" {...register("targetDate")} />
                  </Field>
                </div>
                <fieldset>
                  <legend className="mb-4 text-[0.9375rem] font-semibold">
                    Sizin için öncelik <span className="font-normal text-ink-soft">(isteğe bağlı)</span>
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRIORITIES.map((p) => (
                      <ChoiceCard key={p} type="radio" value={p} label={p} {...register("priority")} />
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <Field id="q-name" label="Ad soyad" error={errors.contactName?.message}>
                  <Input id="q-name" autoComplete="name" aria-invalid={!!errors.contactName} aria-describedby={describedBy("q-name", errors.contactName?.message)} {...register("contactName")} />
                </Field>
                <Field id="q-email" label="E-posta" error={errors.email?.message}>
                  <Input id="q-email" type="email" autoComplete="email" inputMode="email" aria-invalid={!!errors.email} aria-describedby={describedBy("q-email", errors.email?.message)} {...register("email")} />
                </Field>
                <Field id="q-phone" label="Telefon" error={errors.phone?.message}>
                  <Input id="q-phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" aria-invalid={!!errors.phone} aria-describedby={describedBy("q-phone", errors.phone?.message)} {...register("phone")} />
                </Field>
                <Field id="q-ccompany" label="Firma" optional error={errors.contactCompany?.message}>
                  <Input id="q-ccompany" autoComplete="organization" {...register("contactCompany")} />
                </Field>
                <Field id="q-location" label="Şehir / ilçe" optional>
                  <Select id="q-location" {...register("location")}>
                    <option value="">Seçin</option>
                    {locations.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </Select>
                </Field>
                <fieldset className="sm:col-span-2">
                  <legend className="mb-3 text-[0.9375rem] font-semibold">Tercih ettiğiniz iletişim yöntemi</legend>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {CONTACT_METHODS.map((m) => (
                      <ChoiceCard key={m.id} type="radio" value={m.id} label={m.label} {...register("preferredContact")} />
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-8">
                <div>
                  <p className="text-[0.9375rem] font-semibold">
                    Dosya ekleyin <span className="font-normal text-ink-soft">(isteğe bağlı)</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">Brief, şartname veya örnek görseller. PDF, PNG, JPG, WEBP · en fazla {QUOTE_FILES.maxFiles} dosya, her biri 10 MB.</p>
                  <label className="mt-4 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-bg p-6 text-center hover:border-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30">
                    <Paperclip aria-hidden className="size-5 text-brand" />
                    <span className="text-[0.9375rem] font-medium">Dosya seçin</span>
                    <input
                      type="file"
                      multiple
                      accept={Object.values(QUOTE_FILES.accept).flat().join(",")}
                      className="sr-only"
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {fileError ? (
                    <p role="alert" className="mt-3 text-sm font-medium text-danger">
                      {fileError}
                    </p>
                  ) : null}
                  {files.length > 0 ? (
                    <ul className="mt-4 grid gap-2">
                      {files.map((f, i) => (
                        <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-md border border-line px-4 py-2.5 text-sm">
                          <FileText aria-hidden className="size-4 text-ink-soft" />
                          <span className="min-w-0 flex-1 truncate">{f.name}</span>
                          <span className="text-ink-soft tabular-nums">{formatBytes(f.size)}</span>
                          <button type="button" aria-label={`${f.name} dosyasını kaldır`} onClick={() => setFiles(files.filter((_, j) => j !== i))} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-surface-2">
                            <X aria-hidden className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <section aria-labelledby="summary-h" className="rounded-md bg-bg p-6">
                  <h3 id="summary-h" className="font-semibold">
                    Özet
                  </h3>
                  <dl className="mt-4 grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[160px_1fr]">
                    <dt className="text-ink-soft">Hizmetler</dt>
                    <dd>{(v.services ?? []).map(optionLabel).join(", ")}</dd>
                    <dt className="text-ink-soft">İhtiyaç</dt>
                    <dd className="line-clamp-3 whitespace-pre-line">{v.needs}</dd>
                    <dt className="text-ink-soft">Bütçe</dt>
                    <dd>{budgets.find((b) => b.id === v.budget)?.label}</dd>
                    <dt className="text-ink-soft">Başlangıç</dt>
                    <dd>{v.startTiming}</dd>
                    <dt className="text-ink-soft">İletişim</dt>
                    <dd>
                      {v.contactName} · {v.email} · {v.phone}
                    </dd>
                  </dl>
                  <button type="button" onClick={() => setStep(0)} className="mt-4 text-sm font-semibold text-brand hover:underline">
                    Bilgileri düzenleyin
                  </button>
                </section>

                <div className="grid gap-4">
                  <label className="flex cursor-pointer gap-3 text-[0.9375rem]">
                    <input type="checkbox" className="mt-1 size-[18px] shrink-0 accent-[var(--brand)]" aria-invalid={!!errors.kvkk} aria-describedby={errors.kvkk ? "q-kvkk-error" : undefined} {...register("kvkk")} />
                    <span>
                      <Link href="/kvkk-aydinlatma-metni/" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">
                        KVKK Aydınlatma Metni
                      </Link>
                      &apos;ni okudum; talebimin değerlendirilmesi ve benimle iletişime geçilmesi amacıyla kişisel verilerimin işleneceğini biliyorum.
                    </span>
                  </label>
                  {errors.kvkk ? (
                    <p id="q-kvkk-error" role="alert" className="-mt-2 text-sm font-medium text-danger">
                      {errors.kvkk.message}
                    </p>
                  ) : null}
                  <label className="flex cursor-pointer gap-3 text-[0.9375rem] text-ink-muted">
                    <input type="checkbox" className="mt-1 size-[18px] shrink-0 accent-[var(--brand)]" {...register("explicitConsent")} />
                    <span>
                      <Link href="/acik-riza-metni/" target="_blank" className="font-semibold text-brand underline-offset-2 hover:underline">
                        Açık Rıza Metni
                      </Link>
                      &apos;ni okudum ve onaylıyorum. <span className="text-ink-soft">(İsteğe bağlı)</span>
                    </span>
                  </label>
                </div>

                {submitError ? (
                  <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-4 text-[0.9375rem] text-danger">
                    {submitError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          </div>
          <div
            className={
              modal
                ? "sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur md:px-10"
                : "mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"
            }
          >
            {step > 0 ? (
              <Button variant="ghost" onClick={back} disabled={pending}>
                <ArrowLeft aria-hidden className="size-4" /> Geri
              </Button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={next} size={modal ? "md" : "lg"}>
                Devam <ArrowRight aria-hidden className="size-4" />
              </Button>
            ) : (
              <Button type="submit" size={modal ? "md" : "lg"} disabled={pending} aria-busy={pending}>
                {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                Teklif talebini gönder
              </Button>
            )}
          </div>
        </div>
        {modal ? null : (
          <p className="mt-4 text-sm text-ink-soft">Girdiğiniz bilgiler bu tarayıcıda taslak olarak saklanır; sayfayı kapatsanız da kaldığınız yerden devam edebilirsiniz.</p>
        )}
      </form>
  );

  if (modal) {
    return (
      <div ref={rootRef} className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-1">
        <aside data-tone="deep" className="relative isolate flex min-w-0 flex-col gap-4 overflow-hidden bg-deep p-5 pr-16 text-on-deep md:gap-8 md:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-20 -left-16 size-64 rounded-full bg-brand/45 blur-3xl" />
            <div className="absolute -right-24 bottom-0 size-64 rounded-full bg-brand-cyan/25 blur-3xl" />
          </div>
          {header}
          {stepList}
          <p className="mt-auto hidden text-sm leading-relaxed text-on-deep-muted md:block">
            Talebinizi bir uzman inceler; gerekirse kısa bir keşif görüşmesi planlar, yazılı teklifle döneriz. Bilgileriniz bu tarayıcıda taslak olarak saklanır.
          </p>
        </aside>
        <div data-scroll-root className="quote-scroll min-h-0 overflow-y-auto overscroll-contain bg-bg">
          {formEl}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="grid gap-10 lg:grid-cols-12">
      {/* Adım göstergesi */}
      <aside className="min-w-0 lg:col-span-4">{stepList}</aside>
      {formEl}
    </div>
  );
}
