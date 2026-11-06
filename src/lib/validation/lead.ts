import { z } from "zod";
import { TR_PHONE } from "./quote";

const base = {
  name: z.string().trim().min(3, "Adınızı ve soyadınızı yazın.").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta adresi girin.").max(160),
  kvkk: z.literal(true, { error: "Devam etmek için aydınlatma metnini okuduğunuzu onaylayın." }),
  website2: z.string().max(0).optional(),
  idempotencyKey: z.string().uuid(),
};

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || TR_PHONE.test(v), "Geçerli bir telefon numarası girin.");

export const contactSchema = z.object({
  ...base,
  phone: optionalPhone,
  company: z.string().trim().max(160),
  subject: z.string().trim().max(160),
  message: z.string().trim().min(10, "Mesajınızı yazın (en az 10 karakter).").max(5000),
});

export const seoAuditSchema = z.object({
  ...base,
  phone: optionalPhone,
  company: z.string().trim().max(160),
  website: z
    .string()
    .trim()
    .min(4, "Analiz edilecek web sitesini yazın.")
    .max(300)
    .refine((v) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v), "Geçerli bir web adresi girin (ör. firmaniz.com.tr)."),
  goal: z.string().trim().min(1, "Öncelikli hedefinizi seçin.").max(120),
  message: z.string().trim().max(3000),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type SeoAuditInput = z.infer<typeof seoAuditSchema>;

export const SEO_GOALS = [
  "Daha fazla organik trafik",
  "Şehir / ilçe aramalarında görünmek",
  "Belirli hizmetlerde sıralama",
  "Site yenileme sonrası trafik kaybı",
  "Teknik sorunların tespiti",
  "Yapay zekâ aramalarında görünürlük",
] as const;
