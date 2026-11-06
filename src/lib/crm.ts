/** Teklif ve başvuru durumları — admin arayüzü ve sunucu doğrulaması aynı listeyi kullanır. */
export const QUOTE_STATUSES = ["new", "reviewing", "contacted", "preparing", "sent", "meeting", "won", "lost", "archived"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  new: "Yeni",
  reviewing: "İnceleniyor",
  contacted: "İletişime geçildi",
  preparing: "Teklif hazırlanıyor",
  sent: "Teklif gönderildi",
  meeting: "Görüşme",
  won: "Kazanıldı",
  lost: "Kaybedildi",
  archived: "Arşivlendi",
};

export const LEAD_STATUSES = ["new", "contacted", "closed", "spam"] as const;
export const LEAD_STATUS_LABEL: Record<(typeof LEAD_STATUSES)[number], string> = { new: "Yeni", contacted: "İletişime geçildi", closed: "Kapandı", spam: "Spam" };
export const LEAD_SOURCE_LABEL = { contact: "İletişim formu", seo_audit: "Ücretsiz SEO analizi" } as const;

export const NOTE_KIND_LABEL: Record<string, string> = { note: "Not", call: "Telefon görüşmesi", email: "E-posta", meeting: "Toplantı" };
export const CONTACT_LABEL: Record<string, string> = { email: "E-posta", phone: "Telefon", whatsapp: "WhatsApp" };
