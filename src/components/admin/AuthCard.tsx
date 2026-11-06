import Image from "next/image";
import type { ReactNode } from "react";

export function AuthCard({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Image src="/brand/lagen-logo.webp" alt="Lagen Yazılım" width={705} height={240} className="mx-auto h-12 w-auto dark:hidden" priority />
        <Image src="/brand/lagen-logo-dark.webp" alt="Lagen Yazılım" width={705} height={240} className="mx-auto hidden h-12 w-auto dark:block" priority />
        <div className="mt-10 rounded-lg border border-line bg-surface p-8 shadow-card">
          <h1 className="text-h3">{title}</h1>
          {lead ? <p className="mt-2 text-[0.9375rem] text-ink-muted">{lead}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
