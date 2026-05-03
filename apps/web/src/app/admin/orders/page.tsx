import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminOrdersClient } from './admin-orders-client';

export const metadata: Metadata = { title: 'Admin Orders' };

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        ← Admin Dashboard
      </Link>
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        <Link href="/admin" className="hover:underline">Admin</Link>
        {' '}• Orders
      </h1>
      <AdminOrdersClient />
    </div>
  );
}
