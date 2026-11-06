// İlçe sayfası içerik dosyalarını yayın kapısı kurallarıyla kontrol eder (salt okunur).
// Kullanım: node scripts/check-district-pages.mjs [klasör]  (varsayılan: ilçe sayfaları; il sayfaları için src/content/data/city-pages)
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] ?? "src/content/data/district-pages");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
const words = (t) => t.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
const text = (p) => [p.intro, p.localNeeds, p.localSectors, p.serviceModel, ...(p.faqs ?? []).map((f) => `${f.q} ${f.a}`)].join(" ");
const grams = (t, strip) => {
  const w = words(t).filter((x) => !strip.has(x));
  const s = new Set();
  for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(" "));
  return s;
};
const pages = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const SERVICES = ["ankara-web-tasarim", "ankara-seo-hizmeti", "ankara-sosyal-medya-yonetimi", "ankara-ozel-yazilim", "ankara-katalog-tasarimi", "ankara-fotograf-cekimi"];
let bad = 0;
for (const p of pages) {
  const issues = [];
  const wc = words(text(p)).length;
  if (wc < 420) issues.push(`kelime ${wc} < 420`);
  for (const k of ["intro", "localNeeds", "localSectors", "serviceModel"]) if (!p[k] || p[k].trim().length < 80) issues.push(`${k} kısa`);
  if ((p.faqs ?? []).length < 3) issues.push("SSS < 3");
  if (!p.seoTitle || p.seoTitle.length > 60) issues.push(`seoTitle ${p.seoTitle?.length ?? 0} karakter (≤60)`);
  if (!p.seoDescription || p.seoDescription.length > 160 || p.seoDescription.length < 110) issues.push(`seoDescription ${p.seoDescription?.length ?? 0} karakter (110–160)`);
  if (!Array.isArray(p.relatedServices) || p.relatedServices.length < 2 || p.relatedServices.some((s) => !SERVICES.includes(s))) issues.push("relatedServices geçersiz");
  if (/\[KAYNAK/i.test(text(p))) issues.push("[KAYNAK] işareti");
  if (!Array.isArray(p.sources) || p.sources.length < 1) issues.push("sources boş");
  let max = 0, withWho = "";
  for (const o of pages) {
    if (o === p) continue;
    const strip = new Set([...words(p.name), ...words(o.name), "ankara"]);
    const A = grams(text(p), strip), B = grams(text(o), strip);
    let inter = 0;
    for (const g of A) if (B.has(g)) inter++;
    const s = inter / (A.size + B.size - inter || 1);
    if (s > max) { max = s; withWho = o.slug; }
  }
  if (max >= 0.2) issues.push(`benzerlik %${Math.round(max * 100)} (${withWho}) — hedef < %20`);
  const dupH1 = pages.find((o) => o !== p && o.h1 === p.h1);
  if (dupH1) issues.push(`H1 ${dupH1.slug} ile aynı`);
  if (issues.length) bad++;
  console.log(`${issues.length ? "✗" : "✓"} ${p.slug.padEnd(16)} ${String(wc).padStart(4)} kelime  maxSim %${Math.round(max * 100)}  ${issues.join("; ")}`);
}
console.log(`\n${pages.length} sayfa, ${bad} sorunlu`);
process.exit(bad ? 1 : 0);
