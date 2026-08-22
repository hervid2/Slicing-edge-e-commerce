'use client';

import { MotionConfig } from 'motion/react';

/**
 * Global accessibility switch: disables transform-based animations when the
 * OS has `prefers-reduced-motion: reduce`, without wiring each component individually.
 */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
