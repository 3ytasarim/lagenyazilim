import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { serviceImage } from "@/content/images";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/content";

/**
 * Bento hizmet ızgarası: 6 sütunluk ızgarada kartlar 2 (dar) veya 4 (geniş) sütun kaplar;
 * kart sayısı 3'e bölünmüyorsa geniş kartlar boşluk bırakmayacak şekilde yerleştirilir.
 */
function spans(n: number) {
  const s = Array<2 | 4>(n).fill(2);
  if (n % 3 === 2) s[0] = 4;
  if (n % 3 === 1 && n > 1) {
    s[0] = 4;
    s[n - 1] = 4;
  }
  return s;
}

export function ServicesGrid({ services, headingLevel = 3 }: { services: Service[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const sizes = spans(services.length);
  return (
    <ul className="grid gap-4 md:grid-cols-6 md:gap-5">
      {services.map((s, i) => {
        const photo = serviceImage(s.slug);
        const wide = sizes[i] === 4;
        return (
          <li
            key={s.slug}
            data-reveal="scale"
            className={cn("reveal min-w-0", wide ? "md:col-span-6 lg:col-span-4" : "md:col-span-3 lg:col-span-2")}
            style={{ "--d": i % 3 } as React.CSSProperties}
          >
            <Link
              href={`/${s.slug}/`}
              className="group relative isolate flex h-full min-h-[340px] flex-col justify-end overflow-hidden rounded-[24px] border border-white/10 bg-deep p-6 text-white shadow-card transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-float md:min-h-[400px] md:p-8"
            >
              {photo ? (
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes={wide ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw"}
                  className="-z-20 object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.07]"
                />
              ) : (
                <div aria-hidden className="absolute inset-0 -z-20 bg-gradient-to-br from-brand to-brand-cyan" />
              )}
              {/* Okunabilirlik katmanı: alt kısım koyu, üzerine gelince marka tonu */}
              <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#020f3f] via-[#020f3f]/80 to-[#020f3f]/10 transition-opacity duration-500" />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-t from-brand/55 via-brand/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />

              <div className="absolute top-6 right-6 left-6 flex items-start justify-between md:top-8 md:right-8 md:left-8">
                <span className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md transition-[transform,background-color] duration-500 ease-out-expo group-hover:-rotate-6 group-hover:bg-white group-hover:text-deep">
                  <ServiceIcon name={s.icon} className="size-6" />
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-display text-sm text-white/85 tabular-nums backdrop-blur-md">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <H className={cn("font-display font-semibold tracking-tight text-balance", wide ? "text-3xl md:text-4xl" : "text-2xl md:text-[1.75rem]")}>{s.name}</H>
              <p className={cn("mt-3 text-[0.9375rem] leading-relaxed text-white/80", wide && "max-w-[46ch] md:text-base")}>{s.summary}</p>
              <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full border border-white/25 bg-white/10 py-2 pr-2 pl-4 text-sm font-semibold backdrop-blur-md transition-[background-color,color,border-color] duration-500 group-hover:border-white group-hover:bg-white group-hover:text-deep">
                Detayları inceleyin
                <span className="flex size-7 items-center justify-center rounded-full bg-white/15 transition-[transform,background-color] duration-500 ease-out-expo group-hover:rotate-45 group-hover:bg-brand group-hover:text-white">
                  <ArrowUpRight aria-hidden className="size-4" />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
