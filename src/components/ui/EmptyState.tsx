import type { ReactNode } from "react";

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
      <p className="font-display text-h3">{title}</p>
      <p className="mx-auto mt-3 max-w-[52ch] text-ink-muted">{text}</p>
      {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
    </div>
  );
}
