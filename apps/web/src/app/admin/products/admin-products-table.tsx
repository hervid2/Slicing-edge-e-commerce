'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listAdminProducts, type AdminProduct } from '@/lib/api/admin-products';

const PAGE_SIZE = 50;

interface ProductsState {
  products: AdminProduct[];
  loading: boolean;
  error: string;
  total: number;
  totalPages: number;
}

export function AdminProductsTable() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState<ProductsState>({
    products: [],
    loading: true,
    error: '',
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    let mounted = true;

    setState((prev) => ({ ...prev, loading: true, error: '' }));

    listAdminProducts(page, PAGE_SIZE)
      .then((data) => {
        if (!mounted) return;
        setState({
          products: data.products,
          loading: false,
          error: '',
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load products',
        }));
      });

    return () => {
      mounted = false;
    };
  }, [page]);

  if (state.loading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-12 text-center text-sm text-[var(--color-muted)]">
        Loading products…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
        {state.error}
      </div>
    );
  }

  return (
    <div>
      {state.total > 0 && (
        <p className="mb-3 text-sm text-[var(--color-muted)]">{state.total} products total</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-background)] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.products.map((product) => (
              <tr
                key={product.id}
                className="border-t border-[var(--color-border)] hover:bg-[var(--color-background)]"
              >
                <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {product.category?.name ?? product.categoryId}
                </td>
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
            {state.products.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[var(--color-muted)]" colSpan={6}>
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {state.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-[var(--color-muted)]">
            Page {page} of {state.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
            disabled={page === state.totalPages}
            className="rounded border border-[var(--color-border)] px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
