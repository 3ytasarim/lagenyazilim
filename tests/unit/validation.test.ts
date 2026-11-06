import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils";
import { seoAuditSchema } from "@/lib/validation/lead";
import { quoteSchema, validateQuoteFile } from "@/lib/validation/quote";

const validQuote = {
  services: ["kurumsal-web"],
  companyName: "",
  projectName: "",
  currentWebsite: "firmaniz.com.tr",
  sector: "",
  goal: "",
  needs: "Kurumsal sitemizi yenilemek ve teklif talebi almak istiyoruz.",
  features: "",
  referenceSites: "",
  extra: { web_pages: "6–15", web_languages: ["Türkçe", "İngilizce"] },
  budget: "100k-250k",
  startTiming: "Hemen",
  targetDate: "",
  priority: "",
  contactName: "Deneme Kişi",
  email: "Deneme@Example.com",
  phone: "0532 123 45 67",
  contactCompany: "",
  location: "Ankara / Çankaya",
  preferredContact: "email",
  kvkk: true,
  explicitConsent: false,
  idempotencyKey: "7f1c1f3e-8f2a-4c55-9a51-0f7c1e2d3b4a",
  startedAt: 1,
};

describe("quoteSchema", () => {
  it("geçerli talebi kabul eder ve e-postayı küçük harfe çevirir", () => {
    const r = quoteSchema.safeParse(validQuote);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("deneme@example.com");
  });
  it("KVKK onayı olmadan reddeder", () => {
    expect(quoteSchema.safeParse({ ...validQuote, kvkk: false }).success).toBe(false);
  });
  it("hizmet seçilmeden reddeder", () => {
    expect(quoteSchema.safeParse({ ...validQuote, services: [] }).success).toBe(false);
  });
  it("bot tuzağı doluysa reddeder", () => {
    expect(quoteSchema.safeParse({ ...validQuote, website2: "http://spam" }).success).toBe(false);
  });
  it("geçersiz telefonu reddeder", () => {
    expect(quoteSchema.safeParse({ ...validQuote, phone: "123" }).success).toBe(false);
  });
});

describe("validateQuoteFile", () => {
  it("izinli PDF'i kabul eder", () => {
    expect(validateQuoteFile({ name: "brief.pdf", type: "application/pdf", size: 1000 })).toBeNull();
  });
  it("uzantı ile MIME uyuşmazsa reddeder", () => {
    expect(validateQuoteFile({ name: "brief.exe", type: "application/pdf", size: 1000 })).not.toBeNull();
  });
  it("10 MB üzerini reddeder", () => {
    expect(validateQuoteFile({ name: "a.png", type: "image/png", size: 11 * 1024 * 1024 })).not.toBeNull();
  });
});

describe("seoAuditSchema", () => {
  it("web adresi olmadan reddeder", () => {
    const r = seoAuditSchema.safeParse({ name: "Ad Soyad", email: "a@b.co", phone: "", company: "", website: "", goal: "x", message: "", kvkk: true, idempotencyKey: validQuote.idempotencyKey });
    expect(r.success).toBe(false);
  });
});

describe("slugify", () => {
  it("Türkçe karakterleri dönüştürür", () => {
    expect(slugify("Çankaya Web Tasarım Şirketi")).toBe("cankaya-web-tasarim-sirketi");
    expect(slugify("Gölbaşı / İncek")).toBe("golbasi-incek");
  });
});
