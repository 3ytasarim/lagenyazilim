"use client";

import { useState } from "react";
import { EditorContent, mergeAttributes, Node, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { TableKit } from "@tiptap/extension-table";
import { Details, DetailsContent, DetailsSummary } from "@tiptap/extension-details";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Code2,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListPlus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  Unlink,
  Video,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaDialog } from "./MediaPicker";

/** Uyarı / bilgi kutusu bloğu: <div data-callout="info"> */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { tone: { default: "info", parseHTML: (el) => el.getAttribute("data-callout") ?? "info" } };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": node.attrs.tone, class: `callout callout-${node.attrs.tone}` }), 0];
  },
});

/** Görsel hizalama: data-align="center|wide|left" */
const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: { default: "center", parseHTML: (el) => el.getAttribute("data-align") ?? "center", renderHTML: (a) => ({ "data-align": a.align }) },
    };
  },
});

export type LinkTarget = { label: string; href: string };

type Props = {
  name: string;
  csrf: string;
  initialJson?: unknown;
  initialHtml?: string;
  linkTargets?: LinkTarget[];
  placeholder?: string;
};

/**
 * İçerik editörü. İki gizli alan üretir: `${name}Json` (yeniden düzenleme için) ve `${name}Html`.
 * HTML sunucuda yeniden temizlenir (sanitizeRichHtml) — istemci çıktısına güvenilmez.
 */
export function RichTextEditor({ name, csrf, initialJson, initialHtml, linkTargets = [], placeholder = "Yazmaya başlayın…" }: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [snapshot, setSnapshot] = useState({ json: JSON.stringify(initialJson ?? null), html: initialHtml ?? "" });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: null, target: null } } }),
      AlignedImage,
      Youtube.configure({ nocookie: true, controls: true, width: 640, height: 360 }),
      TableKit.configure({ table: { resizable: false } }),
      Details.configure({ persist: true, HTMLAttributes: { class: "faq" } }),
      DetailsSummary,
      DetailsContent,
      Callout,
      Placeholder.configure({ placeholder }),
    ],
    content: (initialJson as object | null) ?? initialHtml ?? "",
    editorProps: { attributes: { class: "prose prose-site max-w-none min-h-[420px] px-5 py-4 outline-none", "aria-label": "İçerik" } },
    onUpdate: ({ editor: e }) => setSnapshot({ json: JSON.stringify(e.getJSON()), html: e.getHTML() }),
  });

  return (
    <div className="overflow-hidden rounded-md border border-line-strong bg-surface focus-within:border-brand">
      <input type="hidden" name={`${name}Json`} value={snapshot.json} />
      <input type="hidden" name={`${name}Html`} value={snapshot.html} />
      {editor ? <Toolbar editor={editor} onImage={() => setMediaOpen(true)} onInternalLink={() => setLinkOpen((v) => !v)} /> : <div className="h-11 border-b border-line" />}
      {linkOpen && editor ? (
        <div className="flex flex-wrap gap-2 border-b border-line bg-surface-2/50 p-3">
          <p className="w-full text-xs font-semibold text-ink-soft uppercase">İç bağlantı ekle (önce metni seçin)</p>
          {linkTargets.map((t) => (
            <button
              key={t.href}
              type="button"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").setLink({ href: t.href }).run();
                setLinkOpen(false);
              }}
              className="rounded-full border border-line-strong bg-surface px-3 py-1 text-sm hover:border-brand hover:text-brand"
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}
      <EditorContent editor={editor} />
      <MediaDialog
        csrf={csrf}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={(m) => {
          if (!m.alt) window.alert("Bu görselin alt metni boş. Erişilebilirlik ve SEO için Medya sayfasından alt metin ekleyin.");
          editor?.chain().focus().setImage({ src: m.url, alt: m.alt, width: m.width ?? undefined, height: m.height ?? undefined } as never).run();
        }}
      />
    </div>
  );
}

function B({ icon: Icon, label, active, onClick, disabled }: { icon: LucideIcon; label: string; active?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("inline-flex size-9 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40", active && "bg-brand-tint text-brand")}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="mx-1 h-6 w-px bg-line" />;
}

function Toolbar({ editor, onImage, onInternalLink }: { editor: Editor; onImage: () => void; onInternalLink: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      link: e.isActive("link"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      code: e.isActive("codeBlock"),
      table: e.isActive("table"),
      image: e.isActive("image"),
      callout: e.isActive("callout"),
    }),
  });

  const c = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Biçimlendirme" className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-surface p-1.5">
      <B icon={Heading2} label="Başlık 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()} />
      <B icon={Heading3} label="Başlık 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()} />
      <B icon={Heading4} label="Başlık 4" active={s.h4} onClick={() => c().toggleHeading({ level: 4 }).run()} />
      <Sep />
      <B icon={Bold} label="Kalın" active={s.bold} onClick={() => c().toggleBold().run()} />
      <B icon={Italic} label="İtalik" active={s.italic} onClick={() => c().toggleItalic().run()} />
      <B icon={Underline} label="Altı çizili" active={s.underline} onClick={() => c().toggleUnderline().run()} />
      <B icon={Strikethrough} label="Üstü çizili" active={s.strike} onClick={() => c().toggleStrike().run()} />
      <Sep />
      <B
        icon={Link2}
        label="Bağlantı"
        active={s.link}
        onClick={() => {
          const prev = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Bağlantı adresi (https://… veya /sayfa/)", prev ?? "https://");
          if (url === null) return;
          if (url === "" || url === "https://") c().extendMarkRange("link").unsetLink().run();
          else if (/^(https?:\/\/|\/|mailto:|tel:)/.test(url)) c().extendMarkRange("link").setLink({ href: url }).run();
        }}
      />
      <B icon={ListPlus} label="İç bağlantı seçici" onClick={onInternalLink} />
      <B icon={Unlink} label="Bağlantıyı kaldır" disabled={!s.link} onClick={() => c().unsetLink().run()} />
      <Sep />
      <B icon={List} label="Madde listesi" active={s.bullet} onClick={() => c().toggleBulletList().run()} />
      <B icon={ListOrdered} label="Numaralı liste" active={s.ordered} onClick={() => c().toggleOrderedList().run()} />
      <B icon={Quote} label="Alıntı" active={s.quote} onClick={() => c().toggleBlockquote().run()} />
      <B icon={Code2} label="Kod bloğu" active={s.code} onClick={() => c().toggleCodeBlock().run()} />
      <B icon={Info} label="Bilgi kutusu" active={s.callout} onClick={() => (s.callout ? c().lift("callout").run() : c().wrapIn("callout").run())} />
      <B
        icon={ListPlus}
        label="SSS bloğu (soru-cevap)"
        onClick={() => c().insertContent({ type: "details", content: [{ type: "detailsSummary", content: [{ type: "text", text: "Soru" }] }, { type: "detailsContent", content: [{ type: "paragraph", content: [{ type: "text", text: "Cevap" }] }] }] }).run()}
      />
      <Sep />
      <B icon={ImageIcon} label="Görsel ekle" onClick={onImage} />
      <B icon={AlignCenter} label="Görsel ortala" disabled={!s.image} onClick={() => c().updateAttributes("image", { align: "center" }).run()} />
      <B icon={AlignLeft} label="Görsel sola" disabled={!s.image} onClick={() => c().updateAttributes("image", { align: "left" }).run()} />
      <B
        icon={Video}
        label="YouTube videosu"
        onClick={() => {
          const url = window.prompt("YouTube bağlantısı");
          if (url && /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) c().setYoutubeVideo({ src: url }).run();
        }}
      />
      <B icon={Table2} label={s.table ? "Satır ekle" : "Tablo ekle"} onClick={() => (s.table ? c().addRowAfter().run() : c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} />
      {s.table ? (
        <>
          <button type="button" onClick={() => c().addColumnAfter().run()} className="h-9 rounded-md px-2 text-xs font-medium text-ink-muted hover:bg-surface-2">
            + Sütun
          </button>
          <button type="button" onClick={() => c().deleteRow().run()} className="h-9 rounded-md px-2 text-xs font-medium text-ink-muted hover:bg-surface-2">
            − Satır
          </button>
          <button type="button" onClick={() => c().deleteTable().run()} className="h-9 rounded-md px-2 text-xs font-medium text-danger hover:bg-danger/10">
            Tabloyu sil
          </button>
        </>
      ) : null}
      <span className="ml-auto flex">
        <B icon={Undo2} label="Geri al" onClick={() => c().undo().run()} />
        <B icon={Redo2} label="Yinele" onClick={() => c().redo().run()} />
      </span>
    </div>
  );
}
