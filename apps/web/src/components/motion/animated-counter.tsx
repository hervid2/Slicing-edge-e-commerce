'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue, useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

/** Counts up from 0 to `value` once it scrolls into view; skips the animation under prefers-reduced-motion. */
export function AnimatedCounter({
  value,
  format = (v) => String(Math.round(v)),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || !ref.current) return;

    if (prefersReducedMotion) {
      ref.current.textContent = format(value);
      return;
    }

    const controls = animate(motionValue, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = format(latest);
      },
    });

    return () => controls.stop();
  }, [isInView, value, prefersReducedMotion, motionValue, format]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
