'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listAdminProducts, type AdminProduct } from '@/lib/api/admin-products';

interface ProductsState {
  products: AdminProduct[];
  loading: boolean;
  error: string;
}

export function AdminProductsTable() {
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: true,
    error: '',
  });

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const data = await listAdminProducts(1, 100);
        if (!mounted) return;
        setState({ products: data.products, loading: false, error: '' });
      } catch (error) {
        if (!mounted) return;
        setState({
          products: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load products',
        });
      }
    }

    loadProducts();

    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading products...</p>;
  }

  if (state.error) {
    return <p className="text-sm text-[var(--color-error)]">{state.error}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--color-background)] text-left">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {state.products.map((product) => (
            <tr key={product.id} className="border-t border-[var(--color-border)]">
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3">{product.category?.name || product.categoryId}</td>
              <td className="px-4 py-3">${Number(product.price).toFixed(2)}</td>
              <td className="px-4 py-3">{product.stock}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    product.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/products/${product.id}/edit`}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {!state.products.length && (
            <tr>
              <td className="px-4 py-6 text-[var(--color-muted)]" colSpan={6}>
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
