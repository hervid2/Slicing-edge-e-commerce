import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata: Metadata = { title: 'Admin Products' };

async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/api/products?page=1&limit=50`, { cache: 'no-store' });
    if (!res.ok) return { products: [] };
    return res.json();
  } catch {
    return { products: [] };
  }
}

export default async function AdminProductsPage() {
  await requireAdmin();
  const data = await getProducts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">Admin • Products</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-background)] text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {(data.products || []).map((product: any) => (
              <tr key={product.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.category?.name || '-'}</td>
                <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
                <td className="px-4 py-3">{product.stock}</td>
              </tr>
            ))}
            {!data.products?.length && (
              <tr><td className="px-4 py-6 text-[var(--color-muted)]" colSpan={4}>No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
