import Image from "next/image";

const WORDS = ["Kurumsal web tasarım", "Özel yazılım", "SEO ve yerel görünürlük", "Yönetim paneli", "Sosyal medya", "Katalog tasarımı", "Yerel SEO", "Teklif ve CRM sistemleri"];

/**
 * Footer'ın üst çerçevesinde kayan marka şeridi: bir dolu gradyan, bir kontur yazı; aralarda dönen logo işareti.
 * Dekoratif (aria-hidden). Kontur yazı ::before ile basılır (görünmez metin olarak kontrast denetimine takılmaz).
 */
export function BrandMarquee() {
  return (
    <div aria-hidden className="marquee py-6 md:py-8">
      {[0, 1].map((k) => (
        <ul key={k}>
          {WORDS.map((w, i) => (
            <li key={w} className="flex items-center gap-12">
              {i % 2 === 0 ? (
                <span className="font-display text-3xl font-semibold tracking-tight whitespace-nowrap text-gradient md:text-5xl">{w}</span>
              ) : (
                <span data-text={w} className="text-outline font-display text-3xl font-semibold tracking-tight whitespace-nowrap md:text-5xl" />
              )}
              <Image src="/brand/lagen-mark.png" alt="" width={512} height={512} className="spin-slow size-7 opacity-80 md:size-9" />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
