import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth-guard';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = { title: 'My Orders' };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: string;
  productName: string;
  productPrice: number | string;
  productImage: string | null;
  quantity: number;
}

interface StatusHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number | string;
  shippingCost: number | string;
  tax: number | string;
  total: number | string;
  currency: string;
  shippingAddress: Record<string, string>;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatCurrency(value: number | string, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function getUserOrders(token: string): Promise<Order[]> {
  try {
    const res = await fetch(`${API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { orders: Order[] };
    return data.orders ?? [];
  } catch {
    return [];
  }
}

export default async function AccountOrdersPage() {
  const session = await requireAuth();
  const token = (session as { apiAccessToken?: string }).apiAccessToken ?? '';
  const orders = await getUserOrders(token);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/account"
          className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          ← My Account
        </Link>
      </div>

      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[var(--color-primary)]/5">
            <ShoppingBag className="h-12 w-12 text-[var(--color-primary)]/25" />
            <span className="absolute -right-1 bottom-0 text-2xl">📦</span>
          </div>
          <p className="mt-6 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
            No orders yet
          </p>
          <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
            Once you place an order it will appear here with full tracking details.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Order number</p>
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {order.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Placed on</p>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted)]">Total</p>
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              {/* Items */}
              <ul className="divide-y divide-[var(--color-border)]">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    {item.productImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="h-14 w-14 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-[var(--color-border)]" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-[var(--color-foreground)]">
                        {item.productName}
                      </p>
                      <p className="text-sm text-[var(--color-muted)]">
                        Qty {item.quantity} ×{' '}
                        {formatCurrency(item.productPrice, order.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      {formatCurrency(
                        Number(item.productPrice) * item.quantity,
                        order.currency,
                      )}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Footer: summary + status timeline */}
              <div className="grid gap-6 border-t border-[var(--color-border)] px-5 py-4 sm:grid-cols-2">
                {/* Totals */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(order.subtotal, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shippingCost, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-muted)]">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax, order.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-border)] pt-1 font-semibold text-[var(--color-foreground)]">
                    <span>Total</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>

                {/* Status timeline */}
                {order.statusHistory.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Timeline
                    </p>
                    <ol className="space-y-2">
                      {order.statusHistory.slice(0, 4).map((entry) => (
                        <li key={entry.id} className="flex gap-3 text-sm">
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[entry.status].split(' ')[0]}`}
                          />
                          <div>
                            <span className="font-medium text-[var(--color-foreground)]">
                              {STATUS_LABELS[entry.status]}
                            </span>
                            <span className="ml-2 text-xs text-[var(--color-muted)]">
                              {formatDate(entry.createdAt)}
                            </span>
                            {entry.note && (
                              <p className="text-xs text-[var(--color-muted)]">{entry.note}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
