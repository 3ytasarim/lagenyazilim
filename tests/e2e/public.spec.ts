import { expect, test } from "@playwright/test";

/* Salt okunur public site senaryoları. */

const KEY_PAGES = ["/", "/ankara-web-tasarim/", "/ankara-seo-hizmeti/", "/hizmetlerimiz/", "/hakkimizda/", "/cozumler/", "/hizmet-bolgeleri/ankara/", "/proje-teklifi/", "/ucretsiz-seo-analizi/", "/iletisim/"];

test.describe("SEO temelleri", () => {
  for (const path of KEY_PAGES) {
    test(`${path}: tek H1, canonical kendisi, açıklama ve JSON-LD`, async ({ page, baseURL }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(path);
      expect((await page.locator('meta[name="description"]').getAttribute("content"))?.length ?? 0).toBeGreaterThan(50);
      expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
      expect(await page.locator('meta[property="og:image"]').getAttribute("content")).toBeTruthy();
      void baseURL;
    });
  }

  test("eski hizmet URL'leri korunur", async ({ request }) => {
    for (const p of ["/ankara-web-tasarim/", "/ankara-seo-hizmeti/", "/ankara-sosyal-medya-yonetimi/", "/ankara-ozel-yazilim/", "/ankara-katalog-tasarimi/", "/hakkimizda/", "/iletisim/"]) {
      expect((await request.get(p, { maxRedirects: 0 })).status(), p).toBe(200);
    }
  });

  test("eski adresler: 301 ve 410", async ({ request }) => {
    const r1 = await request.get("/blog-2/", { maxRedirects: 0 });
    expect(r1.status()).toBe(301);
    expect(new URL(r1.headers().location!, "http://x").pathname).toBe("/blog/");
    for (const p of ["/product/turn-stool-with-felt-2/", "/portfolio/x/", "/team/sandra-willson/", "/shop/", "/wp-login.php", "/ankara-fotograf-cekimi/"]) {
      expect((await request.get(p, { maxRedirects: 0 })).status(), p).toBe(410);
    }
  });

  test("gerçek 404 durum kodu", async ({ request }) => {
    expect((await request.get("/olmayan-bir-sayfa/")).status()).toBe(404);
    expect((await request.get("/blog/olmayan-yazi/")).status()).toBe(404);
    expect((await request.get("/hizmet-bolgeleri/ankara/olmayan-ilce/")).status()).toBe(404);
  });

  test("sitemap ve robots", async ({ request }) => {
    const idx = await request.get("/sitemap.xml");
    expect(idx.status()).toBe(200);
    expect(await idx.text()).toContain("<sitemapindex");
    const svc = await (await request.get("/sitemaps/services.xml")).text();
    expect(svc).toContain("/ankara-web-tasarim/");
    expect(svc).not.toContain("/admin");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
  });

  test("güvenlik başlıkları", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("admin korumalı ve noindex", async ({ request }) => {
    const r = await request.get("/admin/teklifler/", { maxRedirects: 0 });
    expect([302, 307]).toContain(r.status());
    expect(r.headers().location).toContain("/admin/giris/");
    const login = await request.get("/admin/giris/");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
  });
});

test.describe("arayüz", () => {
  test("mega menü açılır, Esc ile kapanır", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: "Hizmetlerimiz" });
    await btn.click();
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  test("@mobile mobil menü ve yatay taşma yok", async ({ page }) => {
    for (const p of ["/", "/ankara-web-tasarim/", "/proje-teklifi/"]) {
      await page.goto(p);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), p).toBeLessThanOrEqual(0);
    }
    await page.goto("/");
    await page.getByRole("button", { name: "Menüyü aç" }).click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await page.getByRole("button", { name: "Menüyü kapat" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("teklif sihirbazı adım doğrulaması (gönderim yok)", async ({ page }) => {
    await page.goto("/proje-teklifi/?hizmet=ozel-yazilim");
    await expect(page.locator('input[name="services"][value="ozel-yazilim"]')).toBeChecked();
    await page.getByRole("button", { name: /Devam/ }).click();
    await page.getByRole("button", { name: /Devam/ }).click();
    await expect(page.getByText("İhtiyacınızı en az birkaç cümleyle anlatın")).toBeVisible();
  });
});
