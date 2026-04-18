'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSession, signOut } from 'next-auth/react';
import { Logo } from '@/components/ui/logo';

const shopLinks = [
  { href: '/products', label: 'All Products' },
  { href: '/categories/chef-knives', label: "Chef's Knives" },
  { href: '/categories/santoku-knives', label: 'Santoku Knives' },
  { href: '/categories/paring-knives', label: 'Paring Knives' },
];

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

const linkClass = 'text-sm text-white/70 transition-colors hover:text-white';

export function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    void getSession().then((session) => {
      if (active) setIsLoggedIn(!!session?.user);
    });
    return () => {
      active = false;
    };
  }, []);

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
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Shop
            </h3>
            <ul className="mt-4 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Support
            </h3>
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
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Account
            </h3>
            <ul className="mt-4 space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && (
                <li>
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: '/' })}
                    className={linkClass + ' cursor-pointer bg-transparent p-0'}
                  >
                    Sign Out
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} Slicing Edge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
