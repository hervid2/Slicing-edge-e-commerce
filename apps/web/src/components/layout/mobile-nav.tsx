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
}

export function MobileNav({ isOpen, onClose, isLoggedIn }: MobileNavProps) {
  if (!isOpen) return null;

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
          <Link
            href="/wishlist"
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
          >
            <Heart className="h-5 w-5" />
            Wishlist
          </Link>
          <Link
            href={isLoggedIn ? '/account' : '/auth/login'}
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
          >
            <User className="h-5 w-5" />
            {isLoggedIn ? 'My Account' : 'Sign In'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
