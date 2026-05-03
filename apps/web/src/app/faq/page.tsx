import type { Metadata } from 'next';
import { FaqAccordion } from './faq-accordion';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description:
    'Find answers to the most common questions about shipping, returns, warranties, and our premium kitchen knives.',
};

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
}

async function getPublicFaqs(): Promise<FaqEntry[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/faq`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { entries?: FaqEntry[] };
    return data.entries ?? [];
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const entries = await getPublicFaqs();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        Frequently Asked Questions
      </h1>
      <p className="mt-4 text-lg text-[var(--color-muted)]">
        Everything you need to know about our knives, orders, and policies. Can&apos;t find what
        you&apos;re looking for?{' '}
        <a
          href="/contact"
          className="rounded text-[var(--color-accent)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          Contact us
        </a>
        .
      </p>

      <div className="mt-12">
        {entries.length > 0 ? (
          <FaqAccordion entries={entries} />
        ) : (
          <p className="text-center text-[var(--color-muted)]">
            No frequently asked questions available right now. Check back soon or{' '}
            <a href="/contact" className="text-[var(--color-accent)] hover:underline">
              contact us
            </a>{' '}
            directly.
          </p>
        )}
      </div>
    </div>
  );
}
