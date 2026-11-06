import type { TitledText } from "@/types/content";

export function ProcessTimeline({ steps }: { steps: TitledText[] }) {
  return (
    <ol className="relative grid gap-10 md:grid-cols-5 md:gap-6">
      <span aria-hidden className="reveal absolute top-5 right-0 left-5 hidden h-px origin-left bg-gradient-to-r from-brand via-brand-cyan to-line-strong md:block" data-reveal="left" />
      {steps.map((s, i) => (
        <li key={s.title} className="reveal group relative flex gap-5 md:flex-col md:gap-0" style={{ "--d": i } as React.CSSProperties}>
          <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-bg font-display text-sm font-semibold tabular-nums transition-[background-color,color,border-color,transform] duration-500 ease-out-expo group-hover:scale-110 group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
            {i + 1}
          </span>
          <div className="md:mt-6">
            <h3 className="text-h3">{s.title}</h3>
            <p className="mt-2 text-[0.9375rem] text-ink-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
