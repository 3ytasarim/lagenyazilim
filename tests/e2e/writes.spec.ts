import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./global-setup";

/*
 * Kayıt oluşturan senaryolar — yalnızca E2E_ALLOW_WRITES=1 ve test/staging veritabanında.
 * Oluşan kayıtlar "qa+e2e@lagen.test" e-postasıyla işaretlidir; temizlik:
 *   delete from quote_requests where email like 'qa+%@lagen.test';
 *   delete from leads where email like 'qa+%@lagen.test';
 */
test.skip(process.env.E2E_ALLOW_WRITES !== "1", "Yazma senaryoları kapalı (E2E_ALLOW_WRITES=1 ile açılır)");

test("teklif talebi gönderilir ve admin'de görünür", async ({ page, browser }) => {
  await page.goto("/proje-teklifi/?hizmet=kurumsal-web");
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.fill("#q-needs", "E2E testi: kurumsal site yenileme ve teklif formu ihtiyacı.");
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.locator('input[name="budget"]').first().check();
  await page.selectOption("#q-start", { index: 1 });
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.fill("#q-name", "E2E Test Kişisi");
  await page.fill("#q-email", "qa+e2e@lagen.test");
  await page.fill("#q-phone", "0532 000 00 00");
  await page.getByRole("button", { name: /Devam/ }).click();
  await page.locator('input[name="kvkk"]').check();
  await page.waitForTimeout(3200); // sunucudaki "çok hızlı gönderim" eşiği
  await page.getByRole("button", { name: /gönder/ }).click();
  const number = await page.locator('[role="status"] strong').textContent({ timeout: 30_000 });
  expect(number).toMatch(/^LGN-\d{4}-\d{6}$/);

  if (fs.existsSync(ADMIN_STATE)) {
    const ctx = await browser.newContext({ storageState: ADMIN_STATE });
    const admin = await ctx.newPage();
    await admin.goto(`/admin/teklifler/?q=${number}`);
    await expect(admin.locator("main tbody")).toContainText(number!);
    await ctx.close();
  }
});
