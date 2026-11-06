"use server";

import { headers } from "next/headers";
import { quoteSchema, validateQuoteFile, QUOTE_FILES } from "@/lib/validation/quote";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { createQuote, plausibleTiming, SubmitError } from "@/server/services/crm";

export type QuoteActionResult =
  | { ok: true; number: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const GENERIC = "Talebiniz şu anda kaydedilemedi. Lütfen birkaç dakika sonra tekrar deneyin veya bize telefonla ulaşın.";

/**
 * Teklif talebi. Doğrulama tamamen sunucuda tekrarlanır (istemci doğrulamasına güvenilmez).
 * Koruma: bot tuzağı, gönderim süresi, IP başına hız sınırı, idempotency anahtarı, dosya türü/boyut denetimi.
 */
export async function submitQuote(formData: FormData): Promise<QuoteActionResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { ok: false, message: "Form verisi okunamadı. Sayfayı yenileyip tekrar deneyin." };
  }

  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    // Bot tuzağı doluysa ayrıntı verilmez
    if (fieldErrors.website2) return { ok: false, message: GENERIC };
    return { ok: false, message: "Bazı alanlar eksik veya hatalı.", fieldErrors };
  }
  const input = parsed.data;
  if (!plausibleTiming(input.startedAt)) return { ok: false, message: "Form çok hızlı veya çok uzun süre sonra gönderildi. Sayfayı yenileyip tekrar deneyin." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > QUOTE_FILES.maxFiles) return { ok: false, message: `En fazla ${QUOTE_FILES.maxFiles} dosya yükleyebilirsiniz.` };
  for (const f of files) {
    const err = validateQuoteFile(f);
    if (err) return { ok: false, message: err };
  }

  const meta = await requestMeta();
  if (!(await rateLimit(`quote:ip:${meta.ipHash ?? "?"}`, 5, 60 * 60))) {
    return { ok: false, message: "Kısa sürede çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin veya bize telefonla ulaşın." };
  }

  try {
    const h = await headers();
    const referer = h.get("referer");
    const ref = referer ? new URL(referer) : null;
    const utm = ref ? Object.fromEntries([...ref.searchParams].filter(([k]) => /^utm_(source|medium|campaign|term|content)$/.test(k)).map(([k, v]) => [k, v.slice(0, 100)])) : {};
    const res = await createQuote(
      input,
      await Promise.all(files.map(async (f) => ({ name: f.name, buf: Buffer.from(await f.arrayBuffer()) }))),
      { ipHash: meta.ipHash, userAgent: meta.userAgent, sourcePath: ref?.pathname ?? null, utm },
    );
    return { ok: true, number: res.number };
  } catch (e) {
    if (e instanceof SubmitError) return { ok: false, message: e.message };
    console.error("[quote]", e);
    return { ok: false, message: GENERIC };
  }
}
