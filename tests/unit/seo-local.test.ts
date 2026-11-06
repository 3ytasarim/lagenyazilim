import { describe, expect, it } from "vitest";
import { legacyDecision, normalizePath } from "@/lib/redirects/legacy";
import { regionPath } from "@/lib/regions";
import { evaluateRegionPage, similarity, type RegionPageText } from "@/server/services/regions";

describe("eski URL kuralları", () => {
  it("hizmet adreslerine dokunmaz (aynen korunur)", () => {
    expect(legacyDecision("/ankara-web-tasarim/")).toBeNull();
    expect(legacyDecision("/hakkimizda/")).toBeNull();
  });
  it("blog-2 ve eski sitemap'leri 301 ile taşır", () => {
    expect(legacyDecision("/blog-2")).toEqual({ type: "redirect", to: "/blog/", status: 301 });
    expect(legacyDecision("/sitemap_index.xml")).toEqual({ type: "redirect", to: "/sitemap.xml", status: 301 });
  });
  it("tema demo içerikleri ve WordPress uçları 410", () => {
    for (const p of ["/product/turn-stool-with-felt-2/", "/portfolio/happy-amazed-blonde/", "/team/sandra-willson/", "/shop/", "/wp-login.php", "/wp-content/uploads/2019/07/1.png", "/author/hilkom/"]) {
      expect(legacyDecision(p)).toEqual({ type: "gone" });
    }
  });
  it("yolu normalize eder", () => {
    expect(normalizePath("/Blog-2")).toBe("/blog-2/");
    expect(normalizePath("/sitemap_index.xml")).toBe("/sitemap_index.xml");
    expect(normalizePath("//a//b")).toBe("/a/b/");
  });
});

describe("bölge adresleri", () => {
  it("ilçe, mahalle ve hizmet+ilçe yollarını üretir", () => {
    expect(regionPath({ slug: "cankaya", kind: "district" }, null, null)).toBe("/hizmet-bolgeleri/ankara/cankaya/");
    expect(regionPath({ slug: "cukurambar", kind: "neighborhood" }, "cankaya", null)).toBe("/hizmet-bolgeleri/ankara/cankaya/cukurambar/");
    expect(regionPath({ slug: "cankaya", kind: "district" }, null, "ankara-web-tasarim")).toBe("/hizmet-bolgeleri/ankara/cankaya/web-tasarim/");
  });
});

const base = (over: Partial<RegionPageText> = {}): RegionPageText => ({
  title: "Çankaya",
  h1: "Çankaya'daki işletmeler için web ve yazılım",
  intro: "Ofisimiz bu ilçede; toplantıları yüz yüze veya çevrim içi yapıyoruz. Keşif görüşmesi ofisimizde ya da işyerinizde olabilir.",
  localNeeds: Array.from({ length: 40 }, (_, i) => `ihtiyaç${i} kurumsal danışmanlık ofisleri teklif formu arama görünürlüğü`).join(" "),
  localSectors: "İş merkezleri ve ofis binaları yoğun.",
  serviceModel: "Keşif toplantısıyla başlar, tasarım sunumları yüz yüze, ara onaylar çevrim içi yapılır. Yayından sonra eğitim verilir.",
  bodyHtml: "",
  faqs: [
    { q: "a", a: "b" },
    { q: "c", a: "d" },
    { q: "e", a: "f" },
  ],
  seoTitle: "Çankaya Web Tasarım",
  seoDescription: "Çankaya açıklama",
  relatedServiceIds: ["1", "2"],
  isServiceCombo: false,
  ...over,
});

describe("bölge yayın kapısı", () => {
  it("doğrulanmış, yeterli ve özgün sayfa 100 alır", () => {
    const r = evaluateRegionPage(base(), { regionVerified: true, regionNames: ["Çankaya", "Ankara"], others: [] });
    expect(r.report.filter((x) => !x.ok).map((x) => x.key)).toEqual([]);
    expect(r.score).toBe(100);
  });
  it("yalnızca ilçe adı değiştirilmiş kopyayı yakalar", () => {
    const page = base();
    const copy = { id: "x", label: "Yenimahalle", text: [page.intro, page.localNeeds, page.localSectors, page.serviceModel].join(" ").replaceAll("Çankaya", "Yenimahalle"), seoTitle: "Başka", h1: "Başka" };
    const r = evaluateRegionPage(page, { regionVerified: true, regionNames: ["Çankaya"], others: [copy] });
    expect(r.report.find((x) => x.key === "similarity")?.ok).toBe(false);
  });
  it("doğrulanmamış bölge, kısa metin, eksik SSS ve [KAYNAK] işaretinde kapı kapalı", () => {
    const r = evaluateRegionPage(base({ localNeeds: "kısa [KAYNAK]", faqs: [] }), { regionVerified: false, regionNames: [], others: [] });
    const failed = r.report.filter((x) => !x.ok).map((x) => x.key);
    expect(failed).toEqual(expect.arrayContaining(["region", "words", "faqs", "sources"]));
    expect(r.score).toBeLessThan(100);
  });
  it("açıklamalı [KAYNAK: …] işaretini de yakalar", () => {
    const r = evaluateRegionPage(base({ localSectors: "Sektör yoğunluğu yüksek [KAYNAK: resmî veri eklenecek]" }), { regionVerified: true, regionNames: [], others: [] });
    expect(r.report.find((x) => x.key === "sources")?.ok).toBe(false);
  });
  it("aynı SEO başlığını reddeder", () => {
    const r = evaluateRegionPage(base(), { regionVerified: true, regionNames: [], others: [{ id: "y", label: "Mamak", text: "tamamen farklı bir metin", seoTitle: "çankaya web tasarım", h1: "farklı" }] });
    expect(r.report.find((x) => x.key === "seo")?.ok).toBe(false);
  });
  it("benzerlik ölçüsü aynı metinde 1, alakasızda 0", () => {
    const t = "bir iki üç dört beş altı yedi sekiz dokuz on";
    expect(similarity(t, t)).toBe(1);
    expect(similarity(t, "elma armut kiraz çilek muz kivi")).toBe(0);
  });
});
