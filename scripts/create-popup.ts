import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { db } from "../src/lib/db";
import { popups } from "../src/lib/db/schema";
import { createMediaAsset } from "../src/server/services/media";

/*
 * Bir görselden duyuru penceresi oluşturur (admin › Duyurular ile aynı tablo).
 * Kullanım:
 *   npx tsx --conditions react-server scripts/create-popup.ts <görsel> --title "..." --alt "..." [--days 30] [--link /hizmetlerimiz/ --label "..."]
 * Git Bash'te "/..." argümanları Windows yoluna çevrilir: MSYS_NO_PATHCONV=1 ile çalıştırın.
 */
function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const file = process.argv[2];
  const title = arg("title");
  const alt = arg("alt");
  if (!file || !fs.existsSync(file) || !title || !alt) throw new Error("Kullanım: create-popup.ts <görsel> --title ... --alt ... [--days 30] [--link ... --label ...]");
  const days = Number(arg("days") ?? 30);
  const link = arg("link");
  if (link && !link.startsWith("/")) throw new Error("--link site içi bir yol olmalı (/ ile başlar). Git Bash kullanıyorsanız MSYS_NO_PATHCONV=1 ekleyin.");
  const media = await createMediaAsset({ buf: fs.readFileSync(file), name: path.basename(file), alt });
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + days * 86_400_000);
  const [row] = await db
    .insert(popups)
    .values({ title, imageId: media.id, alt, linkUrl: link ?? null, linkLabel: arg("label") ?? null, startsAt, endsAt, isActive: true })
    .returning();
  console.log(`✓ Duyuru oluşturuldu: ${row!.title}`);
  console.log(`  ${startsAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })} → ${endsAt.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
