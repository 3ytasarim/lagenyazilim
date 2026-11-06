/** JSON-LD çıktısı; "<" kaçışlanır, böylece içerikteki metin script etiketini kapatamaz. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
