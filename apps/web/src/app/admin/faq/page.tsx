import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = { title: 'Admin · FAQ Manager | Slicing Edge' };

export default async function AdminFaqPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        FAQ Manager
      </h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        Add, edit, and organize frequently asked questions.
      </p>

      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-16 text-center">
        <p className="text-lg font-semibold text-[var(--color-foreground)]">
          FAQ manager coming soon
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          This section will allow you to manage the FAQ entries displayed on the store.
        </p>
      </div>
    </div>
  );
}
