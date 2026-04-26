import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';

export const metadata: Metadata = { title: 'Admin · Contact Messages | Slicing Edge' };

export default async function AdminContactPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Contact Messages
      </h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        Review and respond to customer contact form submissions.
      </p>

      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-16 text-center">
        <p className="text-lg font-semibold text-[var(--color-foreground)]">
          Contact messages coming soon
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          This section will display all messages submitted through the contact form.
        </p>
      </div>
    </div>
  );
}
