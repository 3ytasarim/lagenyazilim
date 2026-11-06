import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Sans } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/components/layout/ThemeToggle";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "@/styles/globals.css";

// Gövde fontu ön yüklenmez: boyut eşlemeli yedek font (adjustFontFallback) kayma yaratmadan ilk boyamayı taşır.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap", preload: false });
// Başlık fontu (LCP öğesi): değişken font — alt küme başına tek dosya
const instrument = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-instrument", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#031b61",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning className={`${inter.variable} ${instrument.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
