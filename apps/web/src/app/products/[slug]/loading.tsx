export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      <div className="mb-6 h-4 w-80 animate-pulse rounded bg-[var(--color-muted)]/20" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-square animate-pulse rounded-lg bg-[var(--color-muted)]/20" />

        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-[var(--color-primary)]/20" />
          <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-accent)]/20" />
          <div className="h-4 w-full animate-pulse rounded bg-[var(--color-muted)]/20" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--color-muted)]/20" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--color-muted)]/20" />
          <div className="pt-2">
            <div className="h-12 w-full animate-pulse rounded-md bg-[var(--color-accent)]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
