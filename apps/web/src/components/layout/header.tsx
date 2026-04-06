'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Heart, User, Search } from 'lucide-react';
import { getSession, signOut } from 'next-auth/react';
import { MobileNav } from './mobile-nav';
import { CartButton } from './cart-button';
import { SearchModal } from '@/components/search/search-modal';

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Collections' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ name?: string | null; email?: string | null } | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const session = await getSession();
      if (!active) return;
      setSessionUser(session?.user ?? null);
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const accountLabel = sessionUser?.name || sessionUser?.email || '';

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--color-primary)] lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--color-primary)] sm:text-2xl"
        >
          Slicing Edge
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {accountLabel && (
            <span className="hidden max-w-40 truncate text-sm text-[var(--color-muted)] lg:inline">
              {accountLabel}
            </span>
          )}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/wishlist"
            className="hidden h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <CartButton />
          {sessionUser ? (
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: '/' })}
              className="hidden h-11 items-center gap-2 rounded-md px-3 text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
              aria-label="Sign out"
              title="Sign out"
            >
              <User className="h-5 w-5" />
              <span className="text-sm">Sign out</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="hidden h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation */}
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Search modal */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </header>
  );
}
