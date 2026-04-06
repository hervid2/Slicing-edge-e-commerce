import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminOrdersClient } from './admin-orders-client';

export const metadata: Metadata = { title: 'Admin Orders' };

export default async function AdminOrdersPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin • Orders
      </h1>
      <AdminOrdersClient />
    </div>
  );
}
