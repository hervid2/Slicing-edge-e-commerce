'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const supportLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/shipping', label: 'Shipping & Returns' },
  { href: '/contact', label: 'Contact' },
  { href: '/faq', label: 'FAQ' },
];

const accountLinksGuest = [
  { href: '/auth/login', label: 'Sign In' },
  { href: '/auth/register', label: 'Create Account' },
  { href: '/orders', label: 'Track Order' },
  { href: '/wishlist', label: 'Wishlist' },
];

const accountLinksAuth = [
  { href: '/account', label: 'My Account' },
  { href: '/account/orders', label: 'Order History' },
  { href: '/orders', label: 'Track Order' },
  { href: '/wishlist', label: 'Wishlist' },
];

const adminManagementLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/users', label: 'Users' },
];

const adminStoreLinks = [
  { href: '/admin/returns', label: 'Returns' },
  { href: '/admin/contact', label: 'Contact Messages' },
  { href: '/admin/faq', label: 'FAQ Manager' },
  { href: '/account', label: 'My Account' },
];

const linkClass = 'text-sm text-white/70 transition-colors hover:text-white';

interface CategoryLink {
  slug: string;
  name: string;
}

export function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<CategoryLink[]>([]);

  useEffect(() => {
    let active = true;

    void Promise.all([
      getSession(),
      fetch(`${API_URL}/api/categories`).then((r) => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
    ]).then(([session, data]) => {
      if (!active) return;
      setIsLoggedIn(!!session?.user);
      setIsAdmin((session?.user as { role?: string })?.role === 'ADMIN');
      setCategories(
        (data.categories as { slug: string; name: string }[]) ?? [],
      );
    });

    return () => {
      active = false;
    };
  }, []);

  const signOutButton = (
    <li>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: '/' })}
        className={linkClass + ' cursor-pointer bg-transparent p-0'}
      >
        Sign Out
      </button>
    </li>
  );

  if (isAdmin) {
    return (
      <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-primary)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <Link href="/admin" aria-label="Slicing Edge — Admin">
                <Logo theme="light" className="h-10 w-auto" />
              </Link>
              <p className="mt-4 text-sm text-white/70">
                Admin panel — manage products, orders, users, and store settings.
              </p>
            </div>

            {/* Management */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">Management</h3>
              <ul className="mt-4 space-y-3">
                {adminManagementLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Store */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">Store</h3>
              <ul className="mt-4 space-y-3">
                {adminStoreLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Session */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider">Session</h3>
              <ul className="mt-4 space-y-3">{signOutButton}</ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} Slicing Edge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  const accountLinks = isLoggedIn ? accountLinksAuth : accountLinksGuest;

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-primary)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" aria-label="Slicing Edge — Home">
              <Logo theme="light" className="h-10 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-white/70">
              Handcrafted premium kitchen knives for culinary professionals and
              home chefs who demand the best.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Shop</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/products" className={linkClass}>
                  All Products
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/products?category=${cat.slug}`} className={linkClass}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">Account</h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && signOutButton}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} Slicing Edge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
