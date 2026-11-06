import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

export const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

/** Admin girişi bir kez yapılır ve oturum durumu saklanır (parola testlere ve raporlara taşınmaz). */
export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) return;
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3490";
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ baseURL });
  await page.goto("/admin/giris/");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("main form button[type=submit]");
  await page.waitForURL((u) => !u.pathname.includes("/giris"), { timeout: 30_000 });
  fs.mkdirSync(path.dirname(ADMIN_STATE), { recursive: true });
  await page.context().storageState({ path: ADMIN_STATE });
  await browser.close();
}
