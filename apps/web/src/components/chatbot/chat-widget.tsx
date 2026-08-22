'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { getSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ChatPanel } from './chat-panel';
import { modalBackdropVariants, modalPanelVariants } from '@/lib/motion-variants';

/**
 * Floating chat widget fixed at the bottom-right corner.
 * Hidden for admin sessions — the chatbot is a customer-facing feature.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void getSession().then((session) => {
      if (!active) return;
      setIsAdmin((session?.user as { role?: string })?.role === 'ADMIN');
    });
    return () => {
      active = false;
    };
  }, []);

  // While loading session, render nothing to avoid flash
  if (isAdmin === null || isAdmin) return null;

  return (
    <>
      {/* Chat panel — desktop: floating card; mobile: full-screen overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="chat-backdrop"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="chat-panel"
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={cn(
                'fixed z-50',
                // Mobile: fill the screen
                'inset-x-4 bottom-20 top-4',
                // sm+: floating card at bottom-right
                'sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-96',
              )}
            >
              <ChatPanel onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          open
            ? 'bg-[var(--color-primary-light)] text-white hover:bg-[var(--color-primary)]'
            : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]',
        )}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
    </>
  );
}
