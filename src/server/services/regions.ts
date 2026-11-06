import "server-only";
import { plainText } from "@/lib/content/html";

/**
 * Bölge sayfası yayın kapısı (docs/local-seo-plan.md). Tüm kontroller geçmeden sayfa yayımlanamaz;
 * amaç ilçe adı değiştirilmiş kopya / ince içerik üretimini engellemek.
 */

export type QualityCheck = { key: string; ok: boolean; message: string };
export type RegionPageText = {
  id?: string | null;
  title: string;
  h1: string;
  intro: string;
  localNeeds: string;
  localSectors: string;
  serviceModel: string;
  bodyHtml: string;
  faqs: { q: string; a: string }[];
  seoTitle: string | null;
  seoDescription: string | null;
  relatedServiceIds: string[];
  isServiceCombo: boolean;
};

export const MIN_WORDS = 350;
export const MAX_SIMILARITY = 0.35;

export function combinedText(p: Pick<RegionPageText, "intro" | "localNeeds" | "localSectors" | "serviceModel" | "bodyHtml" | "faqs">) {
  return [p.intro, p.localNeeds, p.localSectors, p.serviceModel, plainText(p.bodyHtml), ...p.faqs.map((f) => `${f.q} ${f.a}`)].join(" ");
}

const words = (t: string) =>
  t
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Kelime 5-gram kümeleri üzerinde Jaccard benzerliği. Bölge adları çıkarılır ki "ad değiştirme" kopyası yakalansın. */
export function similarity(a: string, b: string, stripNames: string[] = []): number {
  const strip = new Set(stripNames.flatMap((n) => words(n)));
  const grams = (t: string) => {
    const w = words(t).filter((x) => !strip.has(x));
    const s = new Set<string>();
    for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(" "));
    return s;
  };
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

export function evaluateRegionPage(
  page: RegionPageText,
  ctx: { regionVerified: boolean; regionNames: string[]; others: { id: string; label: string; text: string; seoTitle: string | null; h1: string }[] },
): { score: number; report: QualityCheck[] } {
  const text = combinedText(page);
  const wc = words(text).length;
  let maxSim = 0;
  let simWith = "";
  for (const o of ctx.others) {
    const s = similarity(text, o.text, [...ctx.regionNames, o.label]);
    if (s > maxSim) {
      maxSim = s;
      simWith = o.label;
    }
  }
  const dupTitle = page.seoTitle && ctx.others.find((o) => o.seoTitle && o.seoTitle.trim().toLowerCase() === page.seoTitle!.trim().toLowerCase());
  const dupH1 = ctx.others.find((o) => o.h1.trim().toLowerCase() === page.h1.trim().toLowerCase());
  const minRelated = page.isServiceCombo ? 1 : 2;

  const report: QualityCheck[] = [
    { key: "region", ok: ctx.regionVerified, message: ctx.regionVerified ? "Bölge kaydı resmî kaynakla doğrulanmış." : "Bölge kaydı doğrulanmamış (Bölgeler › kaynak ve doğrulama)." },
    { key: "words", ok: wc >= MIN_WORDS, message: `Özgün metin ${wc} kelime (en az ${MIN_WORDS}).` },
    { key: "similarity", ok: maxSim < MAX_SIMILARITY, message: ctx.others.length ? `Diğer bölge sayfalarıyla en yüksek benzerlik %${Math.round(maxSim * 100)}${simWith ? ` (${simWith})` : ""} — sınır %${MAX_SIMILARITY * 100}.` : "Karşılaştırılacak başka bölge sayfası yok." },
    { key: "sections", ok: [page.intro, page.localNeeds, page.serviceModel].every((s) => s.trim().length >= 80), message: "Giriş, bölgeye özgü ihtiyaçlar ve hizmet modeli bölümleri dolu (her biri en az birkaç cümle)." },
    { key: "faqs", ok: page.faqs.length >= 3, message: `Bölgeye özgü SSS: ${page.faqs.length} (en az 3).` },
    { key: "seo", ok: !!page.seoTitle?.trim() && !!page.seoDescription?.trim() && !dupTitle, message: dupTitle ? `SEO başlığı başka bir sayfayla aynı (${dupTitle.label}).` : page.seoTitle && page.seoDescription ? "SEO başlığı ve açıklaması dolu ve tekil." : "SEO başlığı ve açıklaması zorunlu." },
    { key: "h1", ok: !dupH1 && page.h1.trim().length > 10, message: dupH1 ? `H1 başka bir bölge sayfasıyla aynı (${dupH1.label}).` : "H1 tekil." },
    { key: "related", ok: page.relatedServiceIds.length >= minRelated, message: `İlgili hizmet bağlantısı: ${page.relatedServiceIds.length} (en az ${minRelated}).` },
    { key: "sources", ok: !/\[KAYNAK[^\]]*\]/i.test(text), message: /\[KAYNAK[^\]]*\]/i.test(text) ?"Metinde doğrulanmamış [KAYNAK] işareti var." : "Doğrulanmamış iddia işareti yok." },
  ];
  const score = Math.round((report.filter((r) => r.ok).length / report.length) * 100);
  return { score, report };
}
