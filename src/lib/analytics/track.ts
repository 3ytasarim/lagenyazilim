export type TrackEvent =
  | "quote_form_start"
  | "quote_modal_open"
  | "quote_form_step"
  | "quote_form_submit"
  | "seo_audit_submit"
  | "contact_form_submit"
  | "whatsapp_click"
  | "phone_click"
  | "email_click"
  | "portfolio_view"
  | "service_cta_click";

/**
 * Olayları tek bir DOM olayına çevirir; analitik katmanı (çerez onayı verildiyse) bunu dinler.
 * Onay yoksa olay hiçbir yere gönderilmez.
 */
export function track(name: TrackEvent, params: Record<string, string | number> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lagen:track", { detail: { name, params } }));
}
