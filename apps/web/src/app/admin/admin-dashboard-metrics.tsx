'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAdminMetrics, type DashboardMetrics, type OrderStatus } from '@/lib/api/admin-metrics';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function OrdersChart({ data }: { data: DashboardMetrics['ordersByDay'] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartH = 80;
  const barW = 8;
  const gap = 2;
  const totalW = data.length * (barW + gap);

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={chartH + 20}
        aria-label="Orders per day over the last 30 days"
        role="img"
      >
        {data.map((day, i) => {
          const barH = Math.max(2, Math.round((day.count / maxCount) * chartH));
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isWeekend = [0, 6].includes(new Date(day.date + 'T12:00:00').getDay());
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                fill={isWeekend ? 'var(--color-muted, #9ca3af)' : 'var(--color-accent, #3D8B4F)'}
                opacity={day.count === 0 ? 0.25 : 0.85}
              >
                <title>
                  {day.date}: {day.count} order{day.count !== 1 ? 's' : ''}
                </title>
              </rect>
              {i % 7 === 0 && (
                <text
                  x={x + barW / 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--color-muted, #6B7280)"
                >
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AdminDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminMetrics()
      .then((data) => setMetrics(data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load metrics'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Total Orders',
      value: metrics ? String(metrics.kpis.totalOrders) : loading ? '…' : '—',
      sub: metrics ? `${metrics.kpis.pendingOrders} pending` : '',
      href: '/admin/orders',
    },
    {
      label: 'Revenue',
      value: metrics ? formatCurrency(metrics.kpis.totalRevenue) : loading ? '…' : '—',
      sub: 'Excl. cancelled',
      href: '/admin/orders',
    },
    {
      label: 'Active Products',
      value: metrics ? String(metrics.kpis.activeProducts) : loading ? '…' : '—',
      sub: '',
      href: '/admin/products',
    },
    {
      label: 'Users',
      value: metrics ? String(metrics.kpis.totalUsers) : loading ? '…' : '—',
      sub: '',
      href: '/admin/users',
    },
  ];

  return (
    <>
      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load metrics. Check the API connection.
        </div>
      )}

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {kpi.label}
            </p>
            <p className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
              {kpi.value}
            </p>
            {kpi.sub && (
              <p className="mt-1 text-xs text-[var(--color-muted)]">{kpi.sub}</p>
            )}
          </Link>
        ))}
      </div>

      {/* Orders chart */}
      {metrics && (
        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
            Orders — Last 30 Days
          </h2>
          <OrdersChart data={metrics.ordersByDay} />
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            Total:{' '}
            <strong>
              {metrics.ordersByDay.reduce((s, d) => s + d.count, 0)} orders
            </strong>{' '}
            in this period
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        {metrics && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-xs text-[var(--color-accent)] hover:underline">
                View all →
              </Link>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {metrics.recentOrders.length === 0 && (
                <li className="px-5 py-4 text-sm text-[var(--color-muted)]">No orders yet.</li>
              )}
              {metrics.recentOrders.map((order) => {
                const customerLabel =
                  order.user?.name ?? order.user?.email ?? order.guestEmail ?? 'Guest';
                return (
                  <li key={order.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                        {order.orderNumber}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted)]">{customerLabel}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-semibold text-[var(--color-foreground)]">
                        {formatCurrency(order.total)}
                      </span>
                      <span className="hidden text-xs text-[var(--color-muted)] sm:block">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Low-stock products */}
        {metrics && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)]">
                Low Stock
              </h2>
              <Link href="/admin/products" className="text-xs text-[var(--color-accent)] hover:underline">
                Manage →
              </Link>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {metrics.lowStockProducts.length === 0 && (
                <li className="px-5 py-4 text-sm text-[var(--color-muted)]">
                  All products are well-stocked.
                </li>
              )}
              {metrics.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <p className="min-w-0 truncate text-sm font-medium text-[var(--color-foreground)]">
                    {product.name}
                  </p>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.stock <= 3 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {product.stock} left
                    </span>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="text-xs text-[var(--color-accent)] hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
