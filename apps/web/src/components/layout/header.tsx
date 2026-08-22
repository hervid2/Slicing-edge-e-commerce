'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, Heart, User, Search } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { getSession, signOut } from 'next-auth/react';
import { MobileNav } from './mobile-nav';
import { CartButton } from './cart-button';
import { SearchModal } from '@/components/search/search-modal';
import { AdminSearchModal } from '@/components/admin/admin-search-modal';
import { Logo } from '@/components/ui/logo';

const userNavLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/categories', label: 'Collections' },
  { href: '/about', label: 'About' },
];

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const session = await getSession();
      if (!active) return;
      setSessionUser(
        session?.user
          ? { ...session.user, role: (session.user as { role?: string }).role }
          : null,
      );
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const isAdmin = sessionUser?.role === 'ADMIN';
  const navLinks = isAdmin ? adminNavLinks : userNavLinks;
  const accountLabel = sessionUser?.name || sessionUser?.email || '';
  const logoHref = isAdmin ? '/admin' : '/';

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
        <Link href={logoHref} aria-label="Slicing Edge — Home">
          <Logo theme="dark" className="h-9 w-auto" />
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

          {/* Search — admin: quicknav; user: product search */}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
            aria-label={isAdmin ? 'Admin quick search' : 'Search'}
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Wishlist — user only */}
          {!isAdmin && (
            <Link
              href="/wishlist"
              className="hidden h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
          )}

          {/* Cart — user only */}
          {!isAdmin && <CartButton />}

          {/* Account / Sign in / Sign out */}
          {sessionUser ? (
            <>
              <Link
                href={isAdmin ? '/account' : '/account'}
                className="hidden h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
                aria-label="My account"
                title="My account"
              >
                <User className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => void signOut({ callbackUrl: '/' })}
                className="hidden h-11 items-center rounded-md px-2 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-accent)] sm:inline-flex"
                aria-label="Sign out"
                title="Sign out"
              >
                Sign out
              </button>
            </>
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
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={!!sessionUser}
        isAdmin={isAdmin}
      />

      {/* Search / Admin quicknav modal */}
      <AnimatePresence>
        {isSearchOpen && isAdmin && (
          <AdminSearchModal key="admin-search" onClose={() => setIsSearchOpen(false)} />
        )}
        {isSearchOpen && !isAdmin && (
          <SearchModal key="search" onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </header>
  );
}
