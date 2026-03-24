import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-guard';
import { ProductForm } from '../product-form';

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

export const metadata: Metadata = { title: 'Admin Product Create' };

export default async function AdminProductCreatePage() {
  await requireAdmin();

  const categories = await getCategories().catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Admin • New Product
      </h1>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
