import { z } from "zod";

/* Teklif sihirbazı şeması — istemci (adım doğrulama) ve sunucu (kayıt) aynı tanımı kullanır. */

const trimmed = (max: number) => z.string().trim().max(max, `En fazla ${max} karakter girebilirsiniz.`);
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v), "Geçerli bir web adresi girin (ör. firmaniz.com.tr).");

export const TR_PHONE = /^(\+?90|0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}$|^(\+?90|0)?\s*[2-4]\d{2}\s*\d{3}\s*\d{2}\s*\d{2}$/;

export const quoteStep1 = z.object({
  services: z.array(z.string().max(40)).min(1, "En az bir hizmet seçin.").max(8),
});

export const quoteStep2 = z.object({
  companyName: trimmed(160),
  projectName: trimmed(160),
  currentWebsite: optionalUrl,
  sector: trimmed(120),
  goal: trimmed(600),
  needs: z.string().trim().min(20, "İhtiyacınızı en az birkaç cümleyle anlatın (20 karakter).").max(5000),
  features: trimmed(2000),
  referenceSites: trimmed(1000),
  /** Hizmete göre dinamik sorular. Boş checkbox grubu tarayıcıdan false gelebilir. */
  extra: z.record(z.string().max(60), z.union([z.string().max(2000), z.array(z.string().max(120)).max(20), z.literal(false)])),
});

export const quoteStep3 = z.object({
  budget: z.string().min(1, "Bir bütçe aralığı seçin."),
  startTiming: z.string().min(1, "Başlangıç zamanını seçin."),
  targetDate: trimmed(40),
  priority: trimmed(60),
});

export const quoteStep4 = z.object({
  contactName: z.string().trim().min(3, "Adınızı ve soyadınızı yazın.").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin.").max(160),
  phone: z.string().trim().regex(TR_PHONE, "Geçerli bir telefon numarası girin (ör. 0532 123 45 67)."),
  contactCompany: trimmed(160),
  location: trimmed(80),
  preferredContact: z.enum(["email", "phone", "whatsapp"]),
});

export const quoteStep5 = z.object({
  kvkk: z.literal(true, { error: "Devam etmek için aydınlatma metnini okuduğunuzu onaylayın." }),
  explicitConsent: z.boolean(),
});

/** Her adımda doğrulanacak alanlar. */
export const QUOTE_STEP_FIELDS = [quoteStep1, quoteStep2, quoteStep3, quoteStep4, quoteStep5].map((s) => Object.keys(s.shape)) as (keyof QuoteFormValues)[][];

/** Sihirbazdaki tüm alanlar (adım doğrulaması bu şema üzerinden alan bazında yapılır). */
export const quoteFormSchema = z.object({
  ...quoteStep1.shape,
  ...quoteStep2.shape,
  ...quoteStep3.shape,
  ...quoteStep4.shape,
  ...quoteStep5.shape,
});
export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const quoteSchema = quoteFormSchema.extend({
  idempotencyKey: z.string().uuid(),
  /** Bot tuzağı: görünmez alan, dolu gelirse kayıt yapılmaz. */
  website2: z.string().max(0).optional(),
  startedAt: z.number().int(),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

/** Dosya kuralları (sunucuda magic byte ile ayrıca doğrulanır). */
export const QUOTE_FILES = {
  maxFiles: 3,
  maxBytes: 10 * 1024 * 1024,
  accept: {
    "application/pdf": [".pdf"],
    "image/png": [".png"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/webp": [".webp"],
  } as Record<string, string[]>,
};

export function validateQuoteFile(file: { name: string; type: string; size: number }): string | null {
  const exts = QUOTE_FILES.accept[file.type];
  const lower = file.name.toLowerCase();
  if (!exts || !exts.some((e) => lower.endsWith(e))) return `${file.name}: yalnızca PDF, PNG, JPG veya WEBP yükleyebilirsiniz.`;
  if (file.size > QUOTE_FILES.maxBytes) return `${file.name}: dosya 10 MB'tan büyük olamaz.`;
  if (file.size === 0) return `${file.name}: dosya boş.`;
  return null;
}
