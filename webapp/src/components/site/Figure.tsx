import { createContext, useContext, type ReactNode } from 'react';
import { useInView } from '../../lib/motion';

/** True once the surrounding figure has scrolled into view, so charts inside can animate then. */
const InViewContext = createContext(true);
export const useFigureInView = () => useContext(InViewContext);

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
  const [ref, seen] = useInView<HTMLElement>(0.2);
  return (
    <figure ref={ref} className={`${className} ${seen ? 'rise-in' : 'opacity-0'}`}>
      <InViewContext.Provider value={seen}>
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
      </InViewContext.Provider>
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

/** Render-prop access to the figure's in-view state, for hand-built charts inside a <Figure>. */
export function WhenSeen({ children }: { children: (seen: boolean) => ReactNode }) {
  return <>{children(useFigureInView())}</>;
}

/** Shared easing for hand-built bars growing from zero. `i` staggers rows. */
export const growStyle = (i = 0) => ({
  transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms, left 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms, opacity 0.2s ease`,
});
