import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminCategoriesClient } from './admin-categories-client';

export const metadata: Metadata = { title: 'Admin Categories' };

export default async function AdminCategoriesPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        ← Admin Dashboard
      </Link>
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        <Link href="/admin" className="hover:underline">Admin</Link>
        {' '}• Categories
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
