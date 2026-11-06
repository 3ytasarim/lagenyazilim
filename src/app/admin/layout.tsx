import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Yönetim Paneli | Lagen Yazılım", template: "%s | Lagen Yönetim" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
