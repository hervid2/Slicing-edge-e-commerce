'use client';

import { useEffect, useState } from 'react';
import {
  listAdminOrders,
  updateAdminOrderStatus,
  createAdminReturn,
  type AdminOrder,
  type OrderStatus,
} from '@/lib/api/admin-orders';

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

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
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface StatusSelectProps {
  orderId: string;
  current: OrderStatus;
  currentTracking: { trackingNumber: string | null; carrierName: string | null };
  onUpdated: (orderId: string, status: OrderStatus, tracking?: { trackingNumber: string; carrierName: string }) => void;
}

function StatusSelect({ orderId, current, currentTracking, onUpdated }: StatusSelectProps) {
  const [value, setValue] = useState<OrderStatus>(current);
  const [trackingNumber, setTrackingNumber] = useState(currentTracking.trackingNumber ?? '');
  const [carrierName, setCarrierName] = useState(currentTracking.carrierName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pendingShipped = value === 'SHIPPED';

  async function handleSave() {
    setError('');
    setLoading(true);
    try {
      const options =
        value === 'SHIPPED'
          ? { trackingNumber: trackingNumber || undefined, carrierName: carrierName || undefined }
          : {};
      await updateAdminOrderStatus(orderId, value, options);
      setValue(value);
      onUpdated(orderId, value, value === 'SHIPPED' ? { trackingNumber, carrierName } : undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  const dirty = value !== current;

  return (
    <div className="flex flex-col gap-1.5">
      <select
        aria-label="Change order status"
        value={value}
        disabled={loading}
        onChange={(e) => setValue(e.target.value as OrderStatus)}
        className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      {pendingShipped && (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            disabled={loading}
            aria-label="Tracking number"
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          />
          <input
            type="text"
            value={carrierName}
            onChange={(e) => setCarrierName(e.target.value)}
            placeholder="Carrier (e.g. Servientrega)"
            disabled={loading}
            aria-label="Carrier name"
            className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          />
        </div>
      )}

      {dirty && (
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={loading}
          className="inline-flex h-7 items-center justify-center rounded bg-[var(--color-accent)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      )}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

// ── Admin-initiated return form ───────────────────────────────────────────────

const RETURN_REASONS = [
  'Admin-initiated return',
  'Defective or damaged item',
  'Wrong item shipped',
  'Item not as described',
  'Customer request (phone/email)',
  'Undelivered — returned to sender',
  'Other',
] as const;

interface InitiateReturnFormProps {
  orderId: string;
  orderNumber: string;
  activeReturn: { id: string; status: string } | null;
  onCreated: (orderId: string, returnId: string, status: string) => void;
}

function InitiateReturnForm({ orderId, orderNumber, activeReturn, onCreated }: InitiateReturnFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (activeReturn) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-amber-50 px-3 py-2 text-xs">
        <span className="font-semibold text-amber-700">Return in progress:</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-amber-800">
          {activeReturn.status}
        </span>
        <a
          href="/admin/returns"
          className="ml-auto text-[var(--color-accent)] hover:underline focus-visible:outline-none"
        >
          Manage →
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
        Return request created for order <strong>#{orderNumber}</strong>.{' '}
        <a href="/admin/returns" className="underline">
          Go to Returns →
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await createAdminReturn(orderId, {
        reason,
        description: description.trim(),
        adminNote: adminNote.trim() || undefined,
      });
      onCreated(orderId, res.returnRequest.id, res.returnRequest.status);
      setSuccess(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create return.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded border border-dashed border-[var(--color-border)] px-3 text-xs font-medium text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          + Initiate Return
        </button>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
          <p className="text-xs font-semibold text-[var(--color-foreground)]">Initiate Return</p>

          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as typeof reason)}
            disabled={loading}
            aria-label="Return reason"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          >
            {RETURN_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the reason for this return (min. 10 chars)…"
            disabled={loading}
            rows={2}
            minLength={10}
            maxLength={2000}
            required
            aria-label="Return description"
            className="w-full resize-none rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          />

          <input
            type="text"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Internal admin note (optional)"
            disabled={loading}
            maxLength={1000}
            aria-label="Admin note"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-7 items-center rounded bg-[var(--color-accent)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              {loading ? 'Creating…' : 'Create Return'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(''); }}
              disabled={loading}
              className="inline-flex h-7 items-center rounded border border-[var(--color-border)] px-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

interface OrderRowProps {
  order: AdminOrder;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdated: (orderId: string, status: OrderStatus, tracking?: { trackingNumber: string; carrierName: string }) => void;
  onReturnCreated: (orderId: string, returnId: string, status: string) => void;
}

function OrderRow({ order, isExpanded, onToggle, onStatusUpdated, onReturnCreated }: OrderRowProps) {
  const customerLabel = order.user?.name ?? order.user?.email ?? order.guestEmail ?? '—';
  const address = order.shippingAddress as Record<string, string>;
  const activeReturn = order.returnRequests?.[0] ?? null;

  return (
    <>
      <tr className="border-t border-[var(--color-border)] hover:bg-[var(--color-background)]">
        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            aria-expanded={isExpanded}
            className="flex items-center gap-1 font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
            {order.orderNumber}
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">{customerLabel}</td>
        <td className="px-4 py-3">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </td>
        <td className="px-4 py-3">
          <StatusSelect
            orderId={order.id}
            current={order.status}
            currentTracking={{ trackingNumber: order.trackingNumber, carrierName: order.carrierName }}
            onUpdated={onStatusUpdated}
          />
        </td>
        <td className="px-4 py-3 text-sm">{formatCurrency(order.total, order.currency)}</td>
        <td className="px-4 py-3 text-sm text-[var(--color-muted)]">
          {formatDate(order.createdAt)}
        </td>
      </tr>

      {isExpanded ? (
        <tr className="border-t border-[var(--color-border)] bg-[var(--color-background)]">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Items */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Items
                </p>
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 text-sm">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-[var(--color-border)]" />
                      )}
                      <div>
                        <p className="font-medium text-[var(--color-foreground)]">
                          {item.productName}
                        </p>
                        <p className="text-[var(--color-muted)]">
                          {item.quantity} × {formatCurrency(item.productPrice, order.currency)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-3 text-sm">
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
                  <div className="flex justify-between font-semibold text-[var(--color-foreground)]">
                    <span>Total</span>
                    <span>{formatCurrency(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Shipping Address
                </p>
                <address className="not-italic text-sm text-[var(--color-foreground)]">
                  {address.name ? <p>{address.name}</p> : null}
                  {address.line1 ? <p>{address.line1}</p> : null}
                  {address.line2 ? <p>{address.line2}</p> : null}
                  {address.city || address.state || address.postalCode ? (
                    <p>
                      {[address.city, address.state, address.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  ) : null}
                  {address.country ? <p>{address.country}</p> : null}
                </address>
                {order.guestEmail ? (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{order.guestEmail}</p>
                ) : null}
                {(order.trackingNumber || order.carrierName) && (
                  <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      Tracking
                    </p>
                    {order.carrierName && (
                      <p className="text-sm text-[var(--color-foreground)]">{order.carrierName}</p>
                    )}
                    {order.trackingNumber && (
                      <p className="font-mono text-xs text-[var(--color-muted)]">{order.trackingNumber}</p>
                    )}
                  </div>
                )}

                <InitiateReturnForm
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  activeReturn={activeReturn}
                  onCreated={onReturnCreated}
                />
              </div>

              {/* Status timeline */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  Status Timeline
                </p>
                {order.statusHistory.length > 0 ? (
                  <ol className="space-y-2">
                    {order.statusHistory.map((entry) => (
                      <li key={entry.id} className="flex gap-3 text-sm">
                        <span
                          className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[entry.status].split(' ')[0]}`}
                        />
                        <div>
                          <p className="font-medium text-[var(--color-foreground)]">
                            {STATUS_LABELS[entry.status]}
                          </p>
                          <p className="text-xs text-[var(--color-muted)]">
                            {formatDate(entry.createdAt)}
                          </p>
                          {entry.note ? (
                            <p className="text-xs text-[var(--color-muted)]">{entry.note}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">No history yet.</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    listAdminOrders(1, 50)
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  function handleStatusUpdated(
    orderId: string,
    status: OrderStatus,
    tracking?: { trackingNumber: string; carrierName: string },
  ) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              ...(tracking
                ? { trackingNumber: tracking.trackingNumber, carrierName: tracking.carrierName }
                : {}),
            }
          : o,
      ),
    );
  }

  function handleReturnCreated(orderId: string, returnId: string, status: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, returnRequests: [{ id: returnId, status }] }
          : o,
      ),
    );
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted)]">Loading orders…</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--color-background)] text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Change Status</th>
            <th className="px-4 py-3 font-semibold">Total</th>
            <th className="px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              isExpanded={expandedId === order.id}
              onToggle={() => toggleExpand(order.id)}
              onStatusUpdated={handleStatusUpdated}
              onReturnCreated={handleReturnCreated}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
