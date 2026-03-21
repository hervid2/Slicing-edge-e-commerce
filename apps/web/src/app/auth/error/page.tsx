import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication Error',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Authentication Error
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        {error
          ? `Sign in failed: ${error}`
          : 'Something went wrong during authentication.'}
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/auth/login"
          className="inline-flex h-11 items-center justify-center rounded-md bg-[var(--color-accent)] px-6 font-semibold text-white hover:bg-[var(--color-accent-hover)]"
        >
          Back to Login
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--color-border)] px-6 font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
