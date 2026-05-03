import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';
import { AdminFaqClient } from './admin-faq-client';

export const metadata: Metadata = { title: 'Admin · FAQ Manager | Slicing Edge' };

export default async function AdminFaqPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
      >
        ← Admin Dashboard
      </Link>
      <h1 className="mb-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        <Link href="/admin" className="hover:underline">Admin</Link>
        {' '}• FAQ Manager
      </h1>
      <p className="mb-8 text-sm text-[var(--color-muted)]">
        Add, edit, and organize frequently asked questions.
      </p>
      <AdminFaqClient />
    </div>
  );
}
