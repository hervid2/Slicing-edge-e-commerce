'use client';

import Link from 'next/link';
import { Heart, User } from 'lucide-react';

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Collections' },
  { href: '/about', label: 'About' },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export function MobileNav({ isOpen, onClose, isLoggedIn, isAdmin }: MobileNavProps) {
  if (!isOpen) return null;

  const accountHref = isAdmin ? '/admin' : isLoggedIn ? '/account' : '/auth/login';
  const accountLabel = isAdmin ? 'Admin Dashboard' : isLoggedIn ? 'My Account' : 'Sign In';

  return (
    <nav
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="space-y-1 px-4 py-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="block rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
          >
            {link.label}
          </Link>
        ))}
        <div className="border-t border-[var(--color-border)] pt-4">
          {!isAdmin && (
            <Link
              href="/wishlist"
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              Wishlist
            </Link>
          )}
          <Link
            href={accountHref}
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            {accountLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
