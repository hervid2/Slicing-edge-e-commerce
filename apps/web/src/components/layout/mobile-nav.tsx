'use client';

import Link from 'next/link';
import { Heart, User, LayoutDashboard, ShoppingBag, Package, Users, RotateCcw, MessageSquare, HelpCircle, TrendingUp } from 'lucide-react';

const userNavLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Collections' },
  { href: '/about', label: 'About' },
];

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { href: '/admin/contact', label: 'Contact', icon: MessageSquare },
  { href: '/admin/faq', label: 'FAQ Manager', icon: HelpCircle },
  { href: '/account', label: 'Account', icon: User },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

export function MobileNav({ isOpen, onClose, isLoggedIn, isAdmin }: MobileNavProps) {
  if (!isOpen) return null;

  if (isAdmin) {
    return (
      <nav
        className="border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
        aria-label="Admin navigation"
      >
        <div className="space-y-1 px-4 py-4">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Admin Menu
          </p>
          {adminNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
            >
              <Icon className="h-5 w-5 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="space-y-1 px-4 py-4">
        {userNavLinks.map((link) => (
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
            <Heart className="h-5 w-5" aria-hidden="true" />
            Wishlist
          </Link>
          <Link
            href={isLoggedIn ? '/account' : '/auth/login'}
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent)]"
          >
            <User className="h-5 w-5" aria-hidden="true" />
            {isLoggedIn ? 'My Account' : 'Sign In'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
