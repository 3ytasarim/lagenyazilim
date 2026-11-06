"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", maxWidth: 640, margin: "0 auto", color: "#0e1530" }}>
        <h1 style={{ fontSize: "2rem" }}>Beklenmeyen bir hata oluştu</h1>
        <p>Lütfen sayfayı yenileyin. Sorun devam ederse info@lagenyazilim.com.tr adresine yazabilirsiniz.</p>
        <button type="button" onClick={reset} style={{ marginTop: 24, padding: "12px 24px", borderRadius: 999, border: 0, background: "#1a3fb5", color: "#fff", fontWeight: 600 }}>
          Tekrar deneyin
        </button>
      </body>
    </html>
  );
}
