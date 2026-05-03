'use client';

import { useState } from 'react';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
}

interface FaqAccordionProps {
  entries: FaqEntry[];
}

export function FaqAccordion({ entries }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = [...entries].sort((a, b) => a.position - b.position);

  return (
    <div className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      {sorted.map((entry) => {
        const isOpen = openId === entry.id;
        return (
          <div key={entry.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${entry.id}`}
              onClick={() => setOpenId(isOpen ? null : entry.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
            >
              <span className="font-medium">{entry.question}</span>
              <span
                aria-hidden="true"
                className={`shrink-0 text-[var(--color-accent)] transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>

            <div
              id={`faq-answer-${entry.id}`}
              role="region"
              aria-labelledby={`faq-btn-${entry.id}`}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-muted)]"
            >
              {entry.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
