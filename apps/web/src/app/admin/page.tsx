import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-guard';

export default async function AdminHomePage() {
  await requireAdmin();

  const cards = [
    {
      href: '/admin/orders',
      title: 'Orders',
      description: 'View and update order statuses.',
    },
    {
      href: '/admin/products',
      title: 'Products',
      description: 'Manage product catalog, pricing, and stock.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin Dashboard
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Manage the Slicing Edge store operations.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--color-primary)]">
              {card.title}
            </h2>
            <p className="mt-2 text-[var(--color-muted)]">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
