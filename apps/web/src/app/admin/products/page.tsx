import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminProductsTable } from './admin-products-table';

export const metadata: Metadata = { title: 'Admin Products' };

export default async function AdminProductsPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        ← Admin Dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
          <Link href="/admin" className="hover:underline">Admin</Link>
          {' '}• Products
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-flex h-11 items-center rounded-md bg-[var(--color-accent)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          + New Product
        </Link>
      </div>

      <div className="mt-6">
        <AdminProductsTable />
      </div>
    </div>
  );
}
