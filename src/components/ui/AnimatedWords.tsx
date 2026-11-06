import { Fragment } from "react";

/**
 * Metni kelimelere bölüp `.words-rise` ile sırayla yükseltir (yalnızca CSS).
 * `accent` metnin içinde geçiyorsa o bölüm gradyanla vurgulanır.
 */
export function AnimatedWords({ text, accent, start = 0 }: { text: string; accent?: string; start?: number }) {
  const i = accent ? text.indexOf(accent) : -1;
  const parts: { t: string; accent: boolean }[] =
    i < 0 || !accent
      ? [{ t: text, accent: false }]
      : [
          { t: text.slice(0, i), accent: false },
          { t: accent, accent: true },
          { t: text.slice(i + accent.length), accent: false },
        ];
  let n = start;
  return (
    <span className="words-rise">
      {parts.map((p, pi) =>
        p.t
          .split(/(\s+)/)
          .filter(Boolean)
          .map((w, wi) =>
            /^\s+$/.test(w) ? (
              <Fragment key={`${pi}-${wi}`}> </Fragment>
            ) : (
              <span key={`${pi}-${wi}`} className={p.accent ? "w text-gradient" : "w"} style={{ "--i": n++ } as React.CSSProperties}>
                {w}
              </span>
            ),
          ),
      )}
    </span>
  );
}
