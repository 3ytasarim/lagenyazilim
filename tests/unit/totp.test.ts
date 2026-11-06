import { describe, expect, it } from "vitest";
import { base32Decode, base32Encode, totpAt, verifyTotp } from "@/lib/auth/totp";

// RFC 6238 Ek B test vektörü (SHA-1, anahtar "12345678901234567890"), 8 hanenin son 6'sı
const SECRET = base32Encode(Buffer.from("12345678901234567890"));

describe("TOTP", () => {
  it("base32 gidiş-dönüş", () => {
    expect(base32Decode(SECRET).toString()).toBe("12345678901234567890");
    expect(SECRET).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  });
  it("RFC 6238 test vektörleriyle eşleşir", () => {
    expect(totpAt(SECRET, Math.floor(59 / 30))).toBe("287082");
    expect(totpAt(SECRET, Math.floor(1111111109 / 30))).toBe("081804");
    expect(totpAt(SECRET, Math.floor(1234567890 / 30))).toBe("005924");
  });
  it("±1 adım kaymayı kabul eder, tekrar kullanımı reddeder", () => {
    const now = 1234567890 * 1000;
    const step = Math.floor(1234567890 / 30);
    const code = totpAt(SECRET, step);
    expect(verifyTotp(SECRET, code, null, now)).toBe(step);
    expect(verifyTotp(SECRET, code, step, now)).toBeNull();
    expect(verifyTotp(SECRET, totpAt(SECRET, step - 1), null, now)).toBe(step - 1);
    expect(verifyTotp(SECRET, totpAt(SECRET, step - 3), null, now)).toBeNull();
    expect(verifyTotp(SECRET, "12345", null, now)).toBeNull();
  });
});
