import { describe, expect, it, vi } from "vitest";

// next/cache yalnızca Next çalışma zamanında var; saf fonksiyon testlerinde gerekmiyor
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/db", () => ({ db: {} }));

const { renderRichHtml, sanitizeRichHtml, readingMinutes } = await import("@/lib/content/html");
const { parseLocalDateTime, publishFromForm, seoFromForm, toLocalInput } = await import("@/server/services/content");

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("sanitizeRichHtml (XSS)", () => {
  it("script, olay öznitelikleri ve javascript: bağlantılarını temizler", () => {
    const out = sanitizeRichHtml(`<p onclick="x()">Merhaba<script>alert(1)</script></p><img src="x.png" onerror="alert(1)"><a href="javascript:alert(1)">tık</a>`);
    expect(out).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(out).toContain("<p>Merhaba</p>");
  });
  it("YouTube dışındaki iframe'leri kaldırır, YouTube'u nocookie'ye çevirir", () => {
    expect(sanitizeRichHtml(`<iframe src="https://evil.example/x"></iframe>`)).not.toContain("iframe");
    expect(sanitizeRichHtml(`<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>`)).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });
  it("dış bağlantılara noopener ekler, iç bağlantılara eklemez", () => {
    expect(sanitizeRichHtml(`<a href="https://example.com">x</a>`)).toContain('rel="noopener"');
    expect(sanitizeRichHtml(`<a href="/ankara-web-tasarim/">x</a>`)).toBe('<p><a href="/ankara-web-tasarim/">x</a></p>'.replace(/^<p>|<\/p>$/g, ""));
  });
  it("h1'i h2'ye indirger (sayfada tek H1 kuralı)", () => {
    expect(sanitizeRichHtml("<h1>Başlık</h1>")).toBe("<h2>Başlık</h2>");
  });
  it("style özniteliğini kabul etmez", () => {
    expect(sanitizeRichHtml(`<p style="position:fixed">x</p>`)).toBe("<p>x</p>");
  });
});

describe("renderRichHtml", () => {
  it("başlıklara benzersiz Türkçe uyumlu id ekler ve içindekiler üretir", () => {
    const { html, toc } = renderRichHtml("<h2>Özel Yazılım Nedir?</h2><p>a</p><h3>Avantajlar</h3><h2>Özel Yazılım Nedir?</h2>");
    expect(toc.map((t) => t.id)).toEqual(["ozel-yazilim-nedir", "avantajlar", "ozel-yazilim-nedir-2"]);
    expect(html).toContain('<h2 id="ozel-yazilim-nedir">');
  });
  it("okuma süresini en az 1 dakika hesaplar", () => {
    expect(readingMinutes("<p>kısa</p>")).toBe(1);
    expect(readingMinutes(`<p>${"kelime ".repeat(1000)}</p>`)).toBe(5);
  });
});

describe("yayın zamanlaması", () => {
  it("datetime-local değerini Türkiye saati (UTC+3) olarak yorumlar", () => {
    expect(parseLocalDateTime("2026-11-05T10:00")?.toISOString()).toBe("2026-11-05T07:00:00.000Z");
    expect(toLocalInput(new Date("2026-11-05T07:00:00.000Z"))).toBe("2026-11-05T10:00");
    expect(parseLocalDateTime("geçersiz")).toBeNull();
  });
  it("yayında + boş tarih → şimdi; ileri tarih → zamanlanmış", () => {
    const now = publishFromForm(fd({ status: "published", publishedAt: "" }));
    expect(now.status).toBe("published");
    expect(Math.abs(now.publishedAt!.getTime() - Date.now())).toBeLessThan(5000);
    const later = publishFromForm(fd({ status: "published", publishedAt: "2099-01-01T09:00" }));
    expect(later.publishedAt!.getFullYear()).toBe(2099);
  });
  it("bilinmeyen durum taslak sayılır", () => {
    expect(publishFromForm(fd({ status: "hack" })).status).toBe("draft");
  });
});

describe("seoFromForm canonical denetimi", () => {
  it("başka alan adına canonical'ı reddeder", () => {
    const errors: Record<string, string> = {};
    seoFromForm(fd({ canonicalOverride: "https://rakip.com/sayfa/" }), errors);
    expect(errors.canonicalOverride).toBeTruthy();
  });
  it("aynı sitedeki adresi yola çevirir", () => {
    const errors: Record<string, string> = {};
    const s = seoFromForm(fd({ canonicalOverride: "https://www.lagenyazilim.com.tr/ankara-web-tasarim/" }), errors);
    expect(errors).toEqual({});
    expect(s.canonicalOverride).toBe("/ankara-web-tasarim/");
  });
  it("işaretsiz robots kutuları noindex/nofollow demektir", () => {
    const s = seoFromForm(fd({}), {});
    expect(s.robotsIndex).toBe(false);
    expect(s.robotsFollow).toBe(false);
  });
});
