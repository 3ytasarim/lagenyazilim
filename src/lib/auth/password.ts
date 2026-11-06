import "server-only";
import { hash, verify } from "@node-rs/argon2";

/** Argon2id — OWASP önerisine yakın parametreler (19 MiB, 2 tur). */
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(plain: string) {
  return hash(plain, OPTS);
}

export async function verifyPassword(hashed: string, plain: string) {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}

/** Kullanıcı yokken de aynı sürede yanıt vermek için sahte doğrulama (kullanıcı adı tahminini zorlaştırır). */
let dummy: Promise<string> | null = null;
export async function burnVerify(plain: string) {
  dummy ??= hashPassword("lagen-timing-equalizer");
  await verifyPassword(await dummy, plain);
}

export function passwordProblem(p: string): string | null {
  if (p.length < 12) return "Parola en az 12 karakter olmalı.";
  if (p.length > 200) return "Parola çok uzun.";
  if (!/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(p) || !/\d/.test(p)) return "Parola en az bir harf ve bir rakam içermeli.";
  return null;
}
