/**
 * Small motion helpers (no extra library): play an animation once its element scrolls into view,
 * tween a number, and respect the viewer's "reduce motion" setting.
 */
import { useEffect, useRef, useState } from 'react';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True once the element has been at least `threshold` visible. Never flips back. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(reducedMotion);
  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return;
    if (!('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const done = () => {
      setSeen(true);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting || e.boundingClientRect.top < 0) done();
      },
      { threshold }
    );
    // A jump (anchor, back button, fast scroll) can skip past an element without any intersection.
    const onScroll = () => {
      if (el.getBoundingClientRect().top < window.innerHeight) done();
    };
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/** Eases from the previous value to `target` over `ms` (ease-out cubic). */
export function useTween(target: number, ms = 450) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = a + (target - a) * (1 - Math.pow(1 - t, 3));
      from.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}
