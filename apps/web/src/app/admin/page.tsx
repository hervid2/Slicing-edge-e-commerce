import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminDashboardMetrics } from './admin-dashboard-metrics';

export const metadata: Metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin Dashboard
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Store overview — last updated now
      </p>

      <AdminDashboardMetrics />

      {/* Navigation shortcuts */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { href: '/admin/orders', label: 'Orders', desc: 'Update order statuses.' },
          { href: '/admin/products', label: 'Products', desc: 'Manage catalog and stock.' },
          { href: '/admin/categories', label: 'Categories', desc: 'Add or deactivate knife categories.' },
          { href: '/admin/users', label: 'Users', desc: 'View and manage users.' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md"
          >
            <p className="font-semibold text-[var(--color-foreground)]">{link.label}</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
