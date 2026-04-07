export default function AccountOrdersLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" aria-live="polite">
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-[var(--color-muted)]/20" />
      <div className="mb-8 h-10 w-40 animate-pulse rounded-md bg-[var(--color-primary)]/20" />

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
              <div className="space-y-1">
                <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-primary)]/20" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-16 animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-muted)]/20" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-10 animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-5 w-20 animate-pulse rounded bg-[var(--color-primary)]/20" />
              </div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--color-muted)]/20" />
            </div>

            {/* Items */}
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 border-b border-[var(--color-border)] px-5 py-4">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-[var(--color-muted)]/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-primary)]/20" />
                  <div className="h-3 w-32 animate-pulse rounded bg-[var(--color-muted)]/20" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-primary)]/20" />
              </div>
            ))}

            {/* Footer */}
            <div className="px-5 py-4">
              <div className="space-y-2">
                <div className="h-3 w-full max-w-xs animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-3 w-full max-w-xs animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-4 w-full max-w-xs animate-pulse rounded bg-[var(--color-primary)]/20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
