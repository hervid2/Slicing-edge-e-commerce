export default function CartLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12" aria-busy="true" aria-live="polite">
      {/* Heading */}
      <div className="h-10 w-48 animate-pulse rounded-md bg-[var(--color-primary)]/20" />
      <div className="mt-2 h-4 w-36 animate-pulse rounded bg-[var(--color-muted)]/20" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items skeleton */}
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:gap-6 sm:p-6"
            >
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-md bg-[var(--color-muted)]/20 sm:h-32 sm:w-32" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-primary)]/20" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-muted)]/20" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="h-9 w-9 animate-pulse rounded-md bg-[var(--color-border)]" />
                    <div className="h-9 w-10 animate-pulse rounded bg-[var(--color-muted)]/20" />
                    <div className="h-9 w-9 animate-pulse rounded-md bg-[var(--color-border)]" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-red-200/40" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary skeleton */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="h-6 w-36 animate-pulse rounded bg-[var(--color-primary)]/20" />
            <div className="mt-6 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-muted)]/20" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-muted)]/20" />
                <div className="h-4 w-16 animate-pulse rounded bg-[var(--color-muted)]/20" />
              </div>
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex justify-between">
                  <div className="h-5 w-12 animate-pulse rounded bg-[var(--color-primary)]/20" />
                  <div className="h-5 w-24 animate-pulse rounded bg-[var(--color-primary)]/20" />
                </div>
              </div>
            </div>
            <div className="mt-6 h-12 w-full animate-pulse rounded-md bg-[var(--color-accent)]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
