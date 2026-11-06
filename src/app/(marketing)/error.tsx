"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-site py-24 md:py-36">
      <p className="font-display text-sm font-semibold text-danger">Hata</p>
      <h1 className="mt-4 max-w-2xl text-h1">Bir şeyler ters gitti</h1>
      <p className="mt-5 max-w-[56ch] text-lead text-ink-muted">
        Sayfa yüklenirken beklenmeyen bir sorun oluştu. Tekrar deneyebilir veya bize telefonla ulaşabilirsiniz.
      </p>
      {error.digest ? <p className="mt-3 text-sm text-ink-soft">Hata kodu: {error.digest}</p> : null}
      <div className="mt-10 flex flex-wrap gap-3">
        <Button onClick={reset}>Tekrar deneyin</Button>
        <Link href="/" className="inline-flex h-12 items-center px-4 font-semibold text-brand hover:underline">
          Ana sayfa
        </Link>
      </div>
    </section>
  );
}
