import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = { title: 'Admin Orders' };

async function getOrders() {
  try {
    const res = await fetch(`${API_URL}/api/admin/orders?page=1&limit=20`, { cache: 'no-store' });
    if (!res.ok) return { orders: [] };
    return res.json();
  } catch {
    return { orders: [] };
  }
}

export default async function AdminOrdersPage() {
  await requireAdmin();
  const data = await getOrders();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">Admin • Orders</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-background)] text-left">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {(data.orders || []).map((order: { id: string; orderNumber: string; status: string; total: number | string; createdAt: string }) => (
              <tr key={order.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.status}</td>
                <td className="px-4 py-3">${Number(order.total).toFixed(2)}</td>
                <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!data.orders?.length && (
              <tr><td className="px-4 py-6 text-[var(--color-muted)]" colSpan={4}>No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
