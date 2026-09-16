import type { Transition, Variants } from 'motion/react';

/** Shared spring used across hover/tap micro-interactions. */
export const SPRING: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const springHover = {
  scale: 1.02,
  transition: SPRING,
};

export const springPress = {
  scale: 0.97,
  transition: SPRING,
};

/** Fade + translateY reveal, used standalone or as a stagger child. */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Route-level enter/exit transition. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/** Modal backdrop + panel enter/exit transitions. */
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};
