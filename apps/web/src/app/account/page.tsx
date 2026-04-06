import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth-guard';
import { ShoppingBag, Heart, LogOut, User } from 'lucide-react';

export const metadata: Metadata = { title: 'My Account' };

export default async function AccountPage() {
  const session = await requireAuth();
  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0] ?? '?').toUpperCase();

  const memberSince = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const quickLinks = [
    {
      href: '/account/orders',
      icon: ShoppingBag,
      label: 'My Orders',
      description: 'View your order history and track shipments.',
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Wishlist',
      description: 'Your saved products.',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        My Account
      </h1>

      {/* Profile card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-5">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? 'Profile'}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent)] text-xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <p className="text-xl font-semibold text-[var(--color-foreground)]">
              {user.name ?? 'Customer'}
            </p>
            <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Member since {memberSince}
            </p>
          </div>
          {user.role === 'ADMIN' && (
            <span className="ml-auto rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
              Admin
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 border-t border-[var(--color-border)] pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Name
            </p>
            <p className="mt-1 text-sm text-[var(--color-foreground)]">
              {user.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Email
            </p>
            <p className="mt-1 text-sm text-[var(--color-foreground)]">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {quickLinks.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-background)]">
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">{label}</p>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">{description}</p>
            </div>
          </Link>
        ))}
      </div>

      {user.role === 'ADMIN' && (
        <div className="mt-4">
          <Link
            href="/admin"
            className="flex items-start gap-4 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <User className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">Admin Dashboard</p>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                Manage products, orders, and store settings.
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Sign out */}
      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-error)]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
