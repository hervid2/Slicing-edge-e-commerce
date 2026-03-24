export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      <div className="h-10 w-56 animate-pulse rounded-md bg-[var(--color-primary)]/20" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded-md bg-[var(--color-muted)]/20" />

      <div className="mt-8 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-9 w-28 animate-pulse rounded-full bg-[var(--color-border)]"
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
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
