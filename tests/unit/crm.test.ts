import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("next/cache", () => ({ updateTag: () => {}, unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/db", () => ({ db: {} }));

const { toCsv } = await import("@/server/queries/crm");
const { plausibleTiming } = await import("@/server/services/crm");

describe("toCsv", () => {
  it("Excel için BOM ve noktalı virgül kullanır", () => {
    const csv = toCsv([
      ["a", "b"],
      ["1", 2],
    ]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("a;b\r\n1;2");
  });
  it("formül enjeksiyonunu engeller", () => {
    const csv = toCsv([["=HYPERLINK(\"x\")", "+90 532", "-1", "@SUM(A1)", "normal"]]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain("'+90 532");
    expect(csv).toContain("'-1");
    expect(csv).toContain("'@SUM(A1)");
    expect(csv).toContain(";normal");
  });
  it("noktalı virgül ve satır sonu içeren hücreleri tırnaklar", () => {
    expect(toCsv([["a;b", "satır\nsonu", null]]).slice(1)).toBe(`"a;b";"satır\nsonu";`);
  });
});

describe("plausibleTiming", () => {
  const now = 1_000_000_000;
  it("3 saniyeden hızlı gönderimi reddeder", () => {
    expect(plausibleTiming(now - 1500, now)).toBe(false);
  });
  it("normal süreyi kabul eder", () => {
    expect(plausibleTiming(now - 90_000, now)).toBe(true);
  });
  it("24 saatten eski formu reddeder", () => {
    expect(plausibleTiming(now - 25 * 3600_000, now)).toBe(false);
  });
});
