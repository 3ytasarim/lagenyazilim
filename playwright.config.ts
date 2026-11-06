import { defineConfig, devices } from "@playwright/test";

/**
 * Uçtan uca testler. Çalışan bir production sunucusuna karşı koşar (npm run build && npm start).
 *  - Varsayılan: salt okunur senaryolar (veritabanına yazmaz).
 *  - E2E_ALLOW_WRITES=1: form gönderimi gibi kayıt oluşturan senaryolar (yalnızca test/staging veritabanında!).
 *  - E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD: admin senaryoları; giriş global setup'ta bir kez yapılır.
 * Ekran görüntüsü/iz kaydı kapalı: form alanlarına yazılan değerler test çıktılarına sızmasın.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3490",
    channel: "chrome",
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" }, grep: /@mobile/ },
  ],
});
