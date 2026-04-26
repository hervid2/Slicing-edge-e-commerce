import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminCategoriesClient } from './admin-categories-client';

export const metadata: Metadata = { title: 'Admin Categories' };

export default async function AdminCategoriesPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin • Categories
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Add, edit, or deactivate knife categories. Deactivated categories are hidden from the store.
      </p>

      <div className="mt-6">
        <AdminCategoriesClient />
      </div>
    </div>
  );
}
