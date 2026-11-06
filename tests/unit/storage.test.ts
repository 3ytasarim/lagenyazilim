import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileExists, getFile, isValidKey, putFile, removeDir, sniffMime, StorageError } from "@/lib/storage";

let root: string;
const prevDir = process.env.STORAGE_DIR;

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "lagen-storage-"));
  process.env.STORAGE_DIR = root;
});
afterAll(() => {
  process.env.STORAGE_DIR = prevDir;
  rmSync(root, { recursive: true, force: true });
});

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);

describe("depo: yazma / okuma", () => {
  it("public dosya yazılır ve okunur, alan klasörüne düşer", async () => {
    await putFile("public", "media/abc/480.webp", Buffer.from("merhaba"));
    expect((await getFile("public", "media/abc/480.webp"))?.toString()).toBe("merhaba");
    expect(existsSync(path.join(root, "public", "media", "abc", "480.webp"))).toBe(true);
    expect(await fileExists("public", "media/abc/480.webp")).toBe(true);
  });

  it("private dosya public alanından okunamaz (alanlar ayrı)", async () => {
    await putFile("private", "quotes/q1/ek.pdf", Buffer.from("%PDF-1.7 gizli"));
    expect(await getFile("public", "quotes/q1/ek.pdf")).toBeNull();
    expect((await getFile("private", "quotes/q1/ek.pdf"))?.toString()).toContain("gizli");
    expect(existsSync(path.join(root, "public", "quotes"))).toBe(false);
  });

  it("var olan dosyanın üzerine yazmaz", async () => {
    await putFile("public", "media/once/1.webp", Buffer.from("ilk"));
    await expect(putFile("public", "media/once/1.webp", Buffer.from("ikinci"))).rejects.toBeInstanceOf(StorageError);
    expect((await getFile("public", "media/once/1.webp"))?.toString()).toBe("ilk");
  });

  it("olmayan dosyada null döner", async () => {
    expect(await getFile("public", "media/yok/1.webp")).toBeNull();
    expect(await fileExists("private", "quotes/yok/1.pdf")).toBe(false);
  });
});

describe("depo: yol güvenliği", () => {
  it.each(["../x", "media/../../etc/passwd", "/etc/passwd", "C:/Windows/win.ini", "media\\..\\x", "media/./x", "media//x", ".gizli", "media/x\0y", ""])("geçersiz anahtar reddedilir: %j", async (key) => {
    expect(isValidKey(key)).toBe(false);
    await expect(putFile("public", key, Buffer.from("x"))).rejects.toBeInstanceOf(StorageError);
    expect(await getFile("public", key)).toBeNull();
  });

  it("geçersiz alan reddedilir", async () => {
    // @ts-expect-error — çalışma anında yanlış alan
    await expect(putFile("../private", "media/a/b.webp", Buffer.from("x"))).rejects.toBeInstanceOf(StorageError);
  });

  it("sembolik bağlantı üzerinden depo dışına çıkılamaz", async () => {
    const outside = mkdtempSync(path.join(tmpdir(), "lagen-outside-"));
    writeFileSync(path.join(outside, "secret.txt"), "dış");
    mkdirSync(path.join(root, "public", "media"), { recursive: true });
    try {
      symlinkSync(outside, path.join(root, "public", "media", "kacis"), "junction");
    } catch {
      rmSync(outside, { recursive: true, force: true });
      return; // ortam sembolik bağlantıya izin vermiyorsa atla
    }
    expect(await getFile("public", "media/kacis/secret.txt")).toBeNull();
    await expect(putFile("public", "media/kacis/yeni.txt", Buffer.from("x"))).rejects.toBeInstanceOf(StorageError);
    await expect(removeDir("public", "media/kacis")).rejects.toBeInstanceOf(StorageError);
    expect(existsSync(path.join(outside, "secret.txt"))).toBe(true);
    rmSync(path.join(root, "public", "media", "kacis"), { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  });
});

describe("depo: güvenli silme", () => {
  it("kayıt klasörü silinir, komşu klasörler kalır", async () => {
    await putFile("public", "media/sil/1.webp", Buffer.from("a"));
    await putFile("public", "media/kalsin/1.webp", Buffer.from("b"));
    await removeDir("public", "media/sil");
    expect(await getFile("public", "media/sil/1.webp")).toBeNull();
    expect(await getFile("public", "media/kalsin/1.webp")).not.toBeNull();
  });

  it("üst düzey klasör ve alan kökü silinemez", async () => {
    await expect(removeDir("public", "media")).rejects.toBeInstanceOf(StorageError);
    await expect(removeDir("public", "")).rejects.toBeInstanceOf(StorageError);
    await expect(removeDir("public", "..")).rejects.toBeInstanceOf(StorageError);
    expect(await getFile("public", "media/kalsin/1.webp")).not.toBeNull();
  });

  it("olmayan klasörü silmek hata vermez", async () => {
    await expect(removeDir("private", "quotes/hic-yok")).resolves.toBeUndefined();
  });
});

describe("sniffMime: magic byte", () => {
  it("desteklenen türler tanınır", () => {
    expect(sniffMime(png)).toBe("image/png");
    expect(sniffMime(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(12)]))).toBe("image/jpeg");
    expect(sniffMime(Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8 ")]))).toBe("image/webp");
    expect(sniffMime(Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from("ftypavif"), Buffer.alloc(8)]))).toBe("image/avif");
    expect(sniffMime(Buffer.from("%PDF-1.7\n%âãÏÓ"))).toBe("application/pdf");
  });

  it("uzantısı değiştirilmiş veya desteklenmeyen dosyalar reddedilir", () => {
    expect(sniffMime(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull();
    expect(sniffMime(Buffer.from("GIF89a" + "x".repeat(20)))).toBeNull();
    expect(sniffMime(Buffer.from("MZ" + "\0".repeat(30)))).toBeNull(); // Windows çalıştırılabilir
    expect(sniffMime(Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(8)]))).toBeNull(); // MP4
    expect(sniffMime(Buffer.from("%PD"))).toBeNull();
    expect(sniffMime(Buffer.alloc(0))).toBeNull();
  });
});
