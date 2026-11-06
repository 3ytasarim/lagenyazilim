import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Lagen Yazılım — web tasarım, yazılım ve dijital çözümler";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Varsayılan paylaşım görseli (WhatsApp, LinkedIn, X, Facebook).
 * Logo tam ortada ve 630 px'lik kare alanın içinde: WhatsApp küçük önizlemede görseli kare kırptığında da logo eksiksiz görünür.
 * Zemin rengi koyu logonun zemini (#031b61).
 */
export default async function OgImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/lagen-logo-dark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const fontDir = path.join(process.cwd(), "node_modules/@fontsource/instrument-sans/files");
  const [latin, latinExt] = await Promise.all([readFile(path.join(fontDir, "instrument-sans-latin-600-normal.woff")), readFile(path.join(fontDir, "instrument-sans-latin-ext-600-normal.woff"))]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 42%, #0a2a8a 0%, #031b61 55%, #021449 100%)",
          fontFamily: "Instrument Sans",
          color: "#f4f6fc",
          position: "relative",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={560} height={191} alt="" />
        <div style={{ marginTop: 44, fontSize: 30, color: "#c4cdec", letterSpacing: 0.2 }}>Web tasarım · özel yazılım · SEO · Türkiye geneli</div>
        <div style={{ position: "absolute", bottom: 40, fontSize: 24, color: "#8fb4ff" }}>lagenyazilim.com.tr</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Sans", data: latin, weight: 600, style: "normal" },
        { name: "Instrument Sans", data: latinExt, weight: 600, style: "normal" },
      ],
    },
  );
}
