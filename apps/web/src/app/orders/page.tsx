'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Package, Calendar, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000;

type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  shippingCost: string;
  tax: string;
  total: string;
  currency: string;
  createdAt: string;
  items: Array<{ id: string; productName: string; quantity: number; productPrice: string; productImage: string | null }>;
  statusHistory: Array<{ id: string; status: OrderStatus; note: string | null; createdAt: string }>;
}

function statusIcon(status: OrderStatus) {
  switch (status) {
    case 'DELIVERED': return <CheckCircle className="h-5 w-5 text-[var(--color-success)]" />;
    case 'SHIPPED': return <Truck className="h-5 w-5 text-[var(--color-accent)]" />;
    case 'CANCELLED': return <XCircle className="h-5 w-5 text-[var(--color-error)]" />;
    default: return <Package className="h-5 w-5 text-[var(--color-muted)]" />;
  }
}

function useCancelOrder(order: TrackedOrder | null, email: string) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  const isCancellable =
    order !== null &&
    (order.status === 'PENDING' || order.status === 'PROCESSING') &&
    Date.now() - new Date(order.createdAt).getTime() < CANCEL_WINDOW_MS;

  useEffect(() => {
    if (!order || !isCancellable) { setTimeLeft(''); return; }

    function update() {
      if (!order) return;
      const remaining = CANCEL_WINDOW_MS - (Date.now() - new Date(order.createdAt).getTime());
      if (remaining <= 0) { setTimeLeft(''); return; }
      const m = Math.floor(remaining / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${m}m ${s.toString().padStart(2, '0')}s`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [order, isCancellable]);

  return { isCancellable, confirmOpen, setConfirmOpen, cancelling, setCancelling, cancelError, setCancelError, timeLeft };
}

export default function OrdersPage() {
  const { status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('order') ?? '';
  const initialEmail = searchParams.get('email') ?? '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [showOrderCreatedNotice, setShowOrderCreatedNotice] = useState(
    Boolean(initialOrderNumber && initialEmail),
  );
  const autoTracked = useRef(false);

  const { isCancellable, confirmOpen, setConfirmOpen, cancelling, setCancelling, cancelError, setCancelError, timeLeft } =
    useCancelOrder(order, email);

  const trackOrder = useCallback(async (trackingOrderNumber: string, trackingEmail: string) => {
    setError('');
    setOrder(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/orders/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: trackingOrderNumber, email: trackingEmail }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Order not found. Check the details and try again.');
        return;
      }

      const data = await res.json();
      setOrder(data.order);
    } catch {
      setError('Unable to track order right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoTracked.current) return;

    const orderFromQuery = searchParams.get('order')?.trim() ?? '';
    const emailFromQuery = searchParams.get('email')?.trim() ?? '';

    if (!orderFromQuery || !emailFromQuery) return;

    autoTracked.current = true;
    void trackOrder(orderFromQuery, emailFromQuery);
  }, [searchParams, trackOrder]);

  async function onTrack(e: React.FormEvent) {
    e.preventDefault();
    setShowOrderCreatedNotice(false);
    await trackOrder(orderNumber, email);
  }

  async function onCancelConfirm() {
    if (!order) return;
    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`${API_URL}/api/orders/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: order.orderNumber, email }),
      });
      const data = await res.json().catch(() => ({})) as { order?: TrackedOrder; message?: string };
      if (!res.ok) throw new Error(data.message ?? 'Could not cancel the order.');
      setOrder(data.order ?? null);
      setConfirmOpen(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Track Your Order
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Enter your order number and email to check your order status.
      </p>

      {showOrderCreatedNotice && (
        <div className="mt-4 rounded-md bg-green-50 p-3 text-sm text-[var(--color-success)]">
          Order placed successfully. We prefilled your tracking details.
        </div>
      )}

      <form onSubmit={onTrack} className="mt-8 grid gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:grid-cols-2 sm:p-6">
        <Input
          id="order-number"
          label="Order Number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="SE-XXXXX"
          required
        />
        <Input
          id="order-email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            <Search className="mr-2 h-4 w-4" />
            {loading ? 'Tracking...' : 'Track Order'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-[var(--color-error)]">{error}</div>
      )}

      {order && (
        <section className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--color-muted)]">Order</p>
              <p className="font-semibold text-[var(--color-primary)]">{order.orderNumber}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)]">
              {statusIcon(order.status)} {order.status}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Calendar className="h-4 w-4" />
              {new Date(order.createdAt).toLocaleString()}
            </span>

            {isCancellable && (
              <button
                type="button"
                onClick={() => { setConfirmOpen(true); setCancelError(''); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <XCircle className="h-4 w-4" />
                Cancel order
                {timeLeft && (
                  <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-mono text-red-700">
                    {timeLeft}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Inline confirmation dialog */}
          {confirmOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-dialog-title"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <p id="cancel-dialog-title" className="font-semibold text-red-800">
                Cancel order {order.orderNumber}?
              </p>
              <p className="mt-1 text-sm text-red-700">
                This cannot be undone. You will need to place a new order if you change your mind.
              </p>
              {cancelError && (
                <p role="alert" className="mt-2 text-sm font-medium text-red-800">{cancelError}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void onCancelConfirm()}
                  disabled={cancelling}
                  className="inline-flex h-9 items-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  disabled={cancelling}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-background)] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  Keep order
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h2 className="font-semibold text-[var(--color-primary)]">Items</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
                  {item.productImage ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)]">
                      <Image
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">
                      <Package className="h-6 w-6 text-[var(--color-muted)]" />
                    </div>
                  )}
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="font-medium text-[var(--color-foreground)]">{item.productName} <span className="text-[var(--color-muted)]">×{item.quantity}</span></span>
                    <span className="shrink-0 font-medium">${Number(item.productPrice).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between"><span>Shipping</span><span>${Number(order.shippingCost).toFixed(2)}</span></div>
            <div className="mt-1 flex justify-between"><span>Tax</span><span>${Number(order.tax).toFixed(2)}</span></div>
            <div className="mt-2 flex justify-between font-semibold text-[var(--color-primary)]"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-[var(--color-primary)]">Status Timeline</h3>
            <ol className="mt-3 space-y-3">
              {(order.statusHistory ?? []).map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                  <div>
                    <p className="font-medium">{entry.status}</p>
                    {entry.note && <p className="text-[var(--color-muted)]">{entry.note}</p>}
                    <p className="text-xs text-[var(--color-muted)]">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {sessionStatus !== 'authenticated' && (
        <p className="mt-8 text-sm text-[var(--color-muted)]">
          Have an account? <Link href="/auth/login" className="text-[var(--color-accent)] hover:underline">Sign in</Link> to view full order history.
        </p>
      )}
    </div>
  );
}
