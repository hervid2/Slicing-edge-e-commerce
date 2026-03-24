'use client';

import { useEffect, useState } from 'react';
import { ProductForm } from '../../product-form';
import { getAdminProduct, type AdminCategory, type AdminProduct } from '@/lib/api/admin-products';

interface ProductEditClientProps {
  productId: string;
  categories: AdminCategory[];
}

export function ProductEditClient({ productId, categories }: ProductEditClientProps) {
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const response = await getAdminProduct(productId);
        if (!mounted) return;
        setProduct(response.product);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  if (loading) {
    return <p className="text-sm text-[var(--color-muted)]">Loading product...</p>;
  }

  if (error || !product) {
    return <p className="text-sm text-[var(--color-error)]">{error || 'Product not found'}</p>;
  }

  return <ProductForm mode="edit" categories={categories} initialProduct={product} />;
}
