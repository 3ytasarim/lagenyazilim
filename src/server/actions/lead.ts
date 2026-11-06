"use server";

import { headers } from "next/headers";
import { contactSchema, seoAuditSchema } from "@/lib/validation/lead";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { createLead } from "@/server/services/crm";

export type LeadActionResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string> };

function fieldErrorsOf(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.map(String).join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

const GENERIC = "Mesajınız şu anda iletilemedi. Lütfen tekrar deneyin veya bize telefonla ulaşın.";

async function submit(source: "contact" | "seo_audit", input: unknown): Promise<LeadActionResult> {
  const parsed = (source === "contact" ? contactSchema : seoAuditSchema).safeParse(input);
  if (!parsed.success) {
    const fe = fieldErrorsOf(parsed.error.issues);
    if (fe.website2) return { ok: false, message: GENERIC };
    return { ok: false, message: "Bazı alanlar eksik veya hatalı.", fieldErrors: fe };
  }
  const meta = await requestMeta();
  if (!(await rateLimit(`lead:${source}:${meta.ipHash ?? "?"}`, 5, 60 * 60))) {
    return { ok: false, message: "Kısa sürede çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin." };
  }
  try {
    const referer = (await headers()).get("referer");
    await createLead(source, parsed.data, { ipHash: meta.ipHash, sourcePath: referer ? new URL(referer).pathname : null });
    return { ok: true };
  } catch (e) {
    console.error("[lead]", e);
    return { ok: false, message: GENERIC };
  }
}

export async function submitContact(input: unknown): Promise<LeadActionResult> {
  return submit("contact", input);
}

export async function submitSeoAudit(input: unknown): Promise<LeadActionResult> {
  return submit("seo_audit", input);
}
