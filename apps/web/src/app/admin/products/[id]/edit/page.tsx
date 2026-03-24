import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { ProductEditClient } from './product-edit-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getCategories() {
  try {
    const response = await fetch(`${API_URL}/api/categories`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      categories: Array<{ id: string; name: string; slug: string }>;
    };
    return data.categories;
  } catch {
    return [];
  }
}

export const metadata: Metadata = { title: 'Admin Product Edit' };

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const categories = await getCategories().catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin • Edit Product
      </h1>
      <ProductEditClient productId={id} categories={categories} />
    </div>
  );
}
