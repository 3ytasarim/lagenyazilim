import "server-only";
import { headers } from "next/headers";
import { hashIp } from "@/lib/crypto/secret-box";

/** Nginx arkasında gerçek istemci IP'si: X-Real-IP (Nginx ayarlar) → X-Forwarded-For'un ilk değeri. */
export async function requestMeta() {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { ip, ipHash: hashIp(ip), userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}
