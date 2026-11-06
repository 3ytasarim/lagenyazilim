import "server-only";
import sanitizeHtml from "sanitize-html";
import { slugify } from "@/lib/utils";

export type TocItem = { id: string; text: string; level: number };

const YT = /^https:\/\/www\.youtube(-nocookie)?\.com\/embed\/[\w-]{6,20}(\?[\w=&-]*)?$/;

/**
 * Editörden gelen HTML'i izin listesiyle temizler — editör istemcide çalıştığı için çıktısına güvenilmez.
 * İzinli: başlıklar (h2–h4), metin biçimleri, listeler, tablo, görsel, kod, alıntı, uyarı kutusu, SSS (details), YouTube.
 */
export function sanitizeRichHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "code", "pre", "blockquote",
      "ul", "ol", "li", "a", "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
      "div", "details", "summary", "iframe", "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading", "data-align"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
      col: ["style"],
      div: ["data-callout", "data-type", "data-youtube-video", "class"],
      details: ["open", "data-type", "class"],
      summary: ["class"],
      iframe: ["src", "width", "height", "allowfullscreen", "title", "loading"],
      pre: ["class"],
      code: ["class"],
      span: ["class"],
    },
    allowedClasses: { div: ["callout", "callout-info", "callout-warning", "details-content"], code: [/^language-[\w-]+$/], pre: [/^language-[\w-]+$/] },
    allowedSchemes: ["https", "http", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https", "http"] },
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com"],
    allowProtocolRelative: false,
    exclusiveFilter: (frame) => frame.tag === "iframe" && !YT.test(frame.attribs.src ?? ""),
    transformTags: {
      a: (tag, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?lagenyazilim\.com\.tr/.test(href);
        const out: Record<string, string> = external ? { href, target: "_blank", rel: "noopener" } : { href };
        return { tagName: "a", attribs: out };
      },
      img: (tag, attribs) => ({ tagName: "img", attribs: { ...attribs, loading: "lazy" } }),
      iframe: (tag, attribs) => ({
        tagName: "iframe",
        attribs: { src: (attribs.src ?? "").replace("www.youtube.com", "www.youtube-nocookie.com"), width: "640", height: "360", allowfullscreen: "true", title: "Video", loading: "lazy" },
      }),
      h1: "h2",
    },
  });
}

/** Başlıklara benzersiz id ekler ve içindekiler listesini çıkarır. */
export function addHeadingAnchors(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Map<string, number>();
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").trim();
    let id = slugify(text) || "bolum";
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n + 1}`;
    toc.push({ id, text, level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, toc };
}

export function renderRichHtml(input: string) {
  return addHeadingAnchors(sanitizeRichHtml(input));
}

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
