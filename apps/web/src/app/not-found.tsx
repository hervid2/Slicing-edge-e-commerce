import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        404
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        The page you are looking for does not exist or was moved.
      </p>

      <Link
        href="/products"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[var(--color-accent)] px-6 font-semibold text-white hover:bg-[var(--color-accent-hover)]"
      >
        Continue shopping
      </Link>
    </div>
  );
}
