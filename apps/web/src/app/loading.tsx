export default function GlobalLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      <div className="h-10 w-64 animate-pulse rounded-md bg-[var(--color-primary)]/20" />
      <div className="mt-4 h-5 w-full max-w-2xl animate-pulse rounded-md bg-[var(--color-muted)]/20" />

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <div className="aspect-square animate-pulse bg-[var(--color-muted)]/20" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-primary)]/20" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--color-muted)]/20" />
              <div className="h-9 w-full animate-pulse rounded-md bg-[var(--color-accent)]/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
