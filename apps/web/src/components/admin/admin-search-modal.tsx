'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutDashboard, ShoppingBag, Package, Users, RotateCcw, MessageSquare, HelpCircle, UserCircle, TrendingUp, AlertTriangle, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MotionModal } from '@/components/ui/motion-modal';

const adminRoutes = [
  { href: '/admin', label: 'Dashboard', description: 'KPIs, revenue, recent activity', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', description: 'All orders, status management', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', description: 'Product catalog management', icon: Package },
  { href: '/admin/products/new', label: 'Add Product', description: 'Create a new product', icon: PlusCircle },
  { href: '/admin/products?filter=lowstock', label: 'Low Stock', description: 'Products with low inventory', icon: AlertTriangle },
  { href: '/admin/users', label: 'Users', description: 'User management and roles', icon: Users },
  { href: '/admin/returns', label: 'Returns', description: 'Return requests management', icon: RotateCcw },
  { href: '/admin/contact', label: 'Contact', description: 'Customer contact messages', icon: MessageSquare },
  { href: '/admin/faq', label: 'FAQ Manager', description: 'Add and edit FAQ entries', icon: HelpCircle },
  { href: '/account', label: 'My Account', description: 'Profile and account settings', icon: UserCircle },
  { href: '/admin?section=revenue', label: 'Revenue', description: 'Revenue metrics and charts', icon: TrendingUp },
];

interface AdminSearchModalProps {
  onClose: () => void;
}

export function AdminSearchModal({ onClose }: AdminSearchModalProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? adminRoutes.filter(
        (r) =>
          r.label.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase()),
      )
    : adminRoutes;

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <MotionModal
      onClose={onClose}
      ariaLabel="Admin quick search"
      overlayClassName="items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm"
      className="max-w-lg overflow-hidden shadow-2xl"
    >
      {/* Input */}
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[var(--color-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search admin pages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
            aria-label="Search admin pages"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
              No results for &ldquo;{query}&rdquo;
            </li>
          ) : (
            filtered.map((route) => {
              const Icon = route.icon;
              return (
                <li key={route.href} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => navigate(route.href)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      'hover:bg-[var(--color-background)]',
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                      <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{route.label}</p>
                      <p className="text-xs text-[var(--color-muted)]">{route.description}</p>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
    </MotionModal>
  );
}
