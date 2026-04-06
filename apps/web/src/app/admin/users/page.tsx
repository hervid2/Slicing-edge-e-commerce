import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminUsersClient } from './admin-users-client';

export const metadata: Metadata = { title: 'Admin · Users | Slicing Edge' };

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin · Users
      </h1>
      <AdminUsersClient />
    </div>
  );
}
