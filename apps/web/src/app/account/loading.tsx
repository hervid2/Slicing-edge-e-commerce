export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10" aria-busy="true" aria-live="polite">
      <div className="mb-8 h-10 w-40 animate-pulse rounded-md bg-[var(--color-primary)]/20" />

      <div className="space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--color-muted)]/20" />
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-[var(--color-primary)]/20" />
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-muted)]/20" />
          </div>
        </div>

        {/* Fields */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-muted)]/20" />
              <div className="h-10 w-full animate-pulse rounded-md bg-[var(--color-border)]" />
            </div>
          ))}
          <div className="h-10 w-32 animate-pulse rounded-md bg-[var(--color-accent)]/30" />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
          ))}
        </div>
      </div>
    </div>
  );
}
