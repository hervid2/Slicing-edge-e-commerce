'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatPanel } from './chat-panel';

/**
 * Floating chat widget fixed at the bottom-right corner.
 * Renders a FAB to open/close the chat panel.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat panel — desktop: floating card; mobile: full-screen overlay */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className={cn(
              'fixed z-50',
              // Mobile: fill the screen
              'inset-x-4 bottom-20 top-4',
              // sm+: floating card at bottom-right
              'sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[560px] sm:w-96',
            )}
          >
            <ChatPanel onClose={() => setOpen(false)} />
          </div>
        </>
      )}

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
