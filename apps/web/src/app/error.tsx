'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        We hit an unexpected error while loading this page.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--color-accent)] px-6 font-semibold text-white hover:bg-[var(--color-accent-hover)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--color-border)] px-6 font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
