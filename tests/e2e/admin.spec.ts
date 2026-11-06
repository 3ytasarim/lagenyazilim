import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

/* Admin senaryoları (salt okunur) — E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD verilirse çalışır. */
test.skip(!fs.existsSync(ADMIN_STATE) || !process.env.E2E_ADMIN_EMAIL, "Admin kimlik bilgisi verilmedi");
test.use({ storageState: ADMIN_STATE });

const PAGES = ["/admin/", "/admin/teklifler/", "/admin/basvurular/", "/admin/blog/", "/admin/hizmetler/", "/admin/projeler/", "/admin/sayfalar/", "/admin/medya/", "/admin/bolgeler/", "/admin/seo/", "/admin/seo/yonlendirmeler/", "/admin/hesabim/"];

for (const p of PAGES) {
  test(`${p} açılır`, async ({ page }) => {
    const res = await page.goto(p);
    expect(res?.status()).toBe(200);
    await expect(page.locator("main h1")).toBeVisible();
    expect(page.url()).not.toContain("/giris");
  });
}
