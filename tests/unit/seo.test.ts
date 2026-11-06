import { describe, expect, it } from "vitest";
import { buildMetadata, fitTitle, resolveCanonical } from "@/lib/seo/metadata";
import { faqSchema } from "@/lib/seo/schema";

describe("fitTitle", () => {
  it("kısa başlığa marka ekini ekler", () => {
    expect(fitTitle("Hizmetlerimiz")).toBe("Hizmetlerimiz | Lagen Yazılım");
  });
  it("60 karakteri aşınca eki düşürür, başlığı kesmez", () => {
    const long = "Ankara Fotoğraf ve Drone Çekimi: Ürün, Tesis, Kurumsal Çekimler";
    expect(fitTitle(long)).toBe(long);
  });
  it("markayı zaten içeren başlığa ek eklemez", () => {
    expect(fitTitle("Ankara Web Tasarım | Lagen Yazılım")).toBe("Ankara Web Tasarım | Lagen Yazılım");
  });
});

describe("resolveCanonical", () => {
  it("sayfanın kendi mutlak URL'sini döndürür", () => {
    expect(resolveCanonical("/ankara-web-tasarim/")).toBe("https://www.lagenyazilim.com.tr/ankara-web-tasarim/");
  });
  it("aynı host'taki override'ı kabul eder", () => {
    expect(resolveCanonical("/a/", "/ankara-seo-hizmeti/")).toBe("https://www.lagenyazilim.com.tr/ankara-seo-hizmeti/");
  });
  it("çapraz domain override'ı reddeder", () => {
    expect(resolveCanonical("/a/", "https://baska-site.com/a/")).toBe("https://www.lagenyazilim.com.tr/a/");
    expect(resolveCanonical("/a/", "https://lagenyazilim.com.tr/a/")).toBe("https://www.lagenyazilim.com.tr/a/");
  });
});

describe("buildMetadata", () => {
  it("noindex sayfada robots alanını doğru kurar ve varsayılan OG görselini ekler", () => {
    const m = buildMetadata({ path: "/blog/", title: "Blog", description: "d", index: false });
    expect(m.robots).toMatchObject({ index: false, follow: true });
    const og = m.openGraph as { images: { url: string }[] };
    expect(og.images[0]?.url).toBe("https://www.lagenyazilim.com.tr/opengraph-image/");
  });
});

describe("faqSchema", () => {
  it("SSS yoksa şema üretmez", () => {
    expect(faqSchema([])).toBeNull();
  });
});
