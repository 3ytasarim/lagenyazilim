"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { FaqItem } from "@/types/content";

/** SSS akordeonu. Cevap metinleri kapalıyken de DOM'da kalır (forceMount) — tarayıcılar ve ekran okuyucular için. */
export function FaqAccordion({ items, headingLevel = 3 }: { items: FaqItem[]; headingLevel?: 2 | 3 }) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <A.Root type="single" collapsible className="divide-y divide-line border-y border-line">
      {items.map((item, i) => (
        <A.Item key={i} value={`faq-${i}`} className="group">
          <A.Header asChild>
            <H className="font-sans">
              <A.Trigger className="flex w-full items-start justify-between gap-6 py-6 text-left text-[1.0625rem] font-semibold leading-snug text-ink transition-colors hover:text-brand md:text-lg">
                <span>{item.q}</span>
                <Plus
                  aria-hidden
                  className="mt-0.5 size-5 shrink-0 text-ink-soft transition-transform duration-300 ease-out-expo group-data-[state=open]:rotate-45"
                />
              </A.Trigger>
            </H>
          </A.Header>
          <A.Content
            forceMount
            className="overflow-hidden data-[state=closed]:hidden"
          >
            <p className="max-w-[68ch] pb-6 text-ink-muted">{item.a}</p>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
