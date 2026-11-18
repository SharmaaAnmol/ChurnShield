import type { ReactNode } from 'react';

/** A numbered figure: framed body, then "FIG. n  Caption" and the data file it was drawn from. */
export function Figure({
  n,
  caption,
  source,
  plate = false,
  children,
  className = '',
}: {
  n: number;
  caption: ReactNode;
  source: string;
  plate?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div
        className={
          plate
            ? 'plate rounded-[18px] p-6 shadow-[0_18px_40px_-28px_rgb(44_24_34/0.5)] sm:p-8'
            : 'rounded-[18px] border border-rule bg-sheet p-6 sm:p-8'
        }
      >
        {children}
      </div>
      <figcaption className="fig-caption mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span>
          <b>FIG. {n}</b>
          {caption}
        </span>
        <span className="font-mono text-[12px]">source: data/{source}</span>
      </figcaption>
    </figure>
  );
}

/** Small uppercase heading used above sections. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** Shown while the data files load, or when one fails. */
export function DataState({ error }: { error: string | null }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-24 text-[15px] text-ink-2 sm:px-6 lg:px-10" role="status">
      {error ? `Couldn't load the data: ${error}` : 'Loading data…'}
    </div>
  );
}
