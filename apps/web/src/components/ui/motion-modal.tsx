'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { modalBackdropVariants, modalPanelVariants } from '@/lib/motion-variants';

interface MotionModalProps {
  onClose: () => void;
  children: React.ReactNode;
  /** Panel classes — width/padding/overflow, merged over the shared surface/shadow/radius defaults. */
  className?: string;
  /** Overlay classes — alignment/padding/blur, merged over the shared fixed/flex/backdrop defaults. */
  overlayClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

/**
 * Shared backdrop-fade + panel-scale primitive. Has no `open` prop or internal
 * AnimatePresence — callers keep their `{condition && <Modal/>}` render and wrap
 * that in `<AnimatePresence>` themselves, preserving the "fresh mount per open"
 * behavior (autofocus, form-state reset) each call site already relies on.
 */
export function MotionModal({
  onClose,
  children,
  className,
  overlayClassName,
  ariaLabel,
  ariaLabelledBy,
}: MotionModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
        overlayClassName,
      )}
      variants={modalBackdropVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        variants={modalPanelVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-xl bg-[var(--color-surface)] shadow-xl',
          className,
        )}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
