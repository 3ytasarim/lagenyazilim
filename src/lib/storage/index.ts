import "server-only";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, rm, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Dosya deposu. Kökü STORAGE_DIR ortam değişkeni belirler ve release klasörünün DIŞINDA olmalıdır
 * (üretimde: /var/www/lagenyazilim/shared/storage). İki ayrı alan:
 *  - public/  : medya kütüphanesi; /media/* rotasından (veya Nginx alias ile) herkese açık sunulur
 *  - private/ : teklif ekleri; yalnızca oturum + yetki kontrollü indirme rotasından sunulur
 *
 * Güvenlik:
 *  - Anahtarlar katı biçimde doğrulanır (göreli, "/" ayraçlı, yalnızca harf/rakam . _ -; ".." ve mutlak yol yok).
 *  - Çözülen yol alanın kökünden dışarı çıkamaz; yol üzerindeki sembolik bağlantılar reddedilir.
 *  - putFile var olan dosyanın üzerine yazmaz; removeDir alan kökünü ve üst klasörleri silemez.
 */

export type Area = "public" | "private";
export class StorageError extends Error {}

const AREAS: readonly Area[] = ["public", "private"];
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const MAX_KEY = 512;

/**
 * Depo kökü. Üretimde STORAGE_DIR mutlak yol olarak zorunludur (aksi halde dosyalar release klasörüne yazılırdı).
 * Geliştirme, test ve yerel üretim provasında (SITE_URL_ALLOW_INSECURE=1; deploy betiği bunu üretimde reddeder)
 * varsayılan proje içindeki ./storage klasörüdür.
 */
export function storageRoot(): string {
  const env = process.env.STORAGE_DIR?.trim();
  const strict = process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build" && process.env.SITE_URL_ALLOW_INSECURE !== "1";
  if (strict && (!env || !path.isAbsolute(env))) {
    throw new StorageError("STORAGE_DIR üretimde mutlak bir yol olmalı (ör. /var/www/lagenyazilim/shared/storage).");
  }
  // turbopackIgnore: çalışma anındaki depo klasörü derleme izlemesine (output tracing) dahil edilmez
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env || "storage");
}

/** Anahtar biçimi: "media/<uuid>/960.webp", "quotes/<uuid>/<uuid>.pdf" gibi. */
export function isValidKey(key: unknown): key is string {
  if (typeof key !== "string" || key.length === 0 || key.length > MAX_KEY) return false;
  if (key.includes("\\") || key.includes("\0") || key.startsWith("/") || path.isAbsolute(key)) return false;
  return key.split("/").every((s) => SEGMENT.test(s) && s !== "." && s !== "..");
}

function areaBase(area: Area): string {
  if (!AREAS.includes(area)) throw new StorageError("Geçersiz depo alanı.");
  return path.join(storageRoot(), area);
}

function resolveKey(area: Area, key: string): { base: string; full: string } {
  if (!isValidKey(key)) throw new StorageError("Geçersiz dosya anahtarı.");
  const base = areaBase(area);
  const full = path.resolve(base, ...key.split("/"));
  if (!full.startsWith(base + path.sep)) throw new StorageError("Geçersiz dosya yolu.");
  return { base, full };
}

const isNotFound = (e: unknown) => typeof e === "object" && e !== null && "code" in e && ((e as { code: string }).code === "ENOENT" || (e as { code: string }).code === "ENOTDIR");

/** Alan kökünden hedefe kadar var olan her parçayı kontrol eder: sembolik bağlantı ve kök dışına çıkış reddedilir. */
async function assertNoSymlinks(base: string, full: string) {
  const realBase = await realpath(base).catch(() => null);
  let cur = base;
  for (const part of path.relative(base, full).split(path.sep)) {
    cur = path.join(cur, part);
    try {
      const st = await lstat(cur);
      if (st.isSymbolicLink()) throw new StorageError("Sembolik bağlantı içeren yol reddedildi.");
    } catch (e) {
      if (isNotFound(e)) return; // yolun geri kalanı henüz yok
      throw e;
    }
  }
  if (realBase) {
    const real = await realpath(full).catch(() => null);
    if (real && real !== realBase && !real.startsWith(realBase + path.sep)) throw new StorageError("Depo dışına çıkan yol reddedildi.");
  }
}

/** O_NOFOLLOW destekleniyorsa (Linux/macOS) son parçada sembolik bağlantı açılmaz. */
const NOFOLLOW = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;

/** Dosyayı yazar. Aynı anahtarda dosya varsa hata verir (üzerine yazmaz). */
export async function putFile(area: Area, key: string, data: Buffer): Promise<void> {
  const { base, full } = resolveKey(area, key);
  if (!Buffer.isBuffer(data)) throw new StorageError("Geçersiz dosya içeriği.");
  try {
    await mkdir(base, { recursive: true });
    await assertNoSymlinks(base, path.dirname(full));
    await mkdir(path.dirname(full), { recursive: true });
    await assertNoSymlinks(base, full);
    const fh = await open(full, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o640);
    try {
      await fh.writeFile(data);
    } finally {
      await fh.close();
    }
  } catch (e) {
    if (e instanceof StorageError) throw e;
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "EEXIST") throw new StorageError("Bu anahtarda zaten bir dosya var.");
    console.error("[storage] yazma hatası", { area, key, code: (e as { code?: string })?.code });
    throw new StorageError("Dosya kaydedilemedi.");
  }
}

/** Dosyayı okur. Yoksa, anahtar geçersizse veya yol güvenli değilse null döner. */
export async function getFile(area: Area, key: string): Promise<Buffer | null> {
  let resolved: { base: string; full: string };
  try {
    resolved = resolveKey(area, key);
    await assertNoSymlinks(resolved.base, resolved.full);
  } catch {
    return null;
  }
  try {
    const fh = await open(resolved.full, constants.O_RDONLY | NOFOLLOW);
    try {
      if (!(await fh.stat()).isFile()) return null;
      return await fh.readFile();
    } finally {
      await fh.close();
    }
  } catch (e) {
    if (!isNotFound(e)) console.error("[storage] okuma hatası", { area, key, code: (e as { code?: string })?.code });
    return null;
  }
}

export async function fileExists(area: Area, key: string): Promise<boolean> {
  try {
    const { base, full } = resolveKey(area, key);
    await assertNoSymlinks(base, full);
    return (await stat(full)).isFile();
  } catch {
    return false;
  }
}

/**
 * Bir kaydın klasörünü (ör. "media/<id>", "quotes/<id>") siler.
 * Kazara toplu silmeye karşı: en az iki parçalı anahtar zorunlu (alan kökü veya "media" gibi üst klasör silinemez),
 * yol üzerinde sembolik bağlantı varsa silinmez. Klasör yoksa sessizce geçer.
 */
export async function removeDir(area: Area, key: string): Promise<void> {
  const { base, full } = resolveKey(area, key);
  if (key.split("/").length < 2) throw new StorageError("Üst düzey klasör silinemez.");
  await assertNoSymlinks(base, full);
  await rm(full, { recursive: true, force: true });
}

/** Magic byte ile gerçek dosya türü — istemcinin bildirdiği MIME'a güvenilmez. Desteklenen: PNG, JPEG, WEBP, AVIF, PDF. */
export function sniffMime(buf: Buffer): string | null {
  if (!Buffer.isBuffer(buf) || buf.length < 5) return null;
  if (buf.toString("latin1", 0, 5) === "%PDF-") return "application/pdf";
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString("latin1", 1, 8) === "PNG\r\n\x1a\n") return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") return "image/webp";
  // ISO-BMFF: [4 bayt kutu boyu]["ftyp"][marka] — AVIF görüntü (avif) ve dizi (avis) markaları
  if (buf.toString("latin1", 4, 8) === "ftyp") {
    const brand = buf.toString("latin1", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}
