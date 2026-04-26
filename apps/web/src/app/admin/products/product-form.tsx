'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createAdminProduct,
  deactivateAdminProduct,
  type AdminCategory,
  type AdminProduct,
  type AdminProductInput,
  type AdminProductImageInput,
  updateAdminProduct,
  uploadAdminImage,
} from '@/lib/api/admin-products';

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: AdminCategory[];
  initialProduct?: AdminProduct;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  stock: string;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function ProductForm({ mode, categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => ({
    name: initialProduct?.name ?? '',
    slug: initialProduct?.slug ?? '',
    description: initialProduct?.description ?? '',
    price: initialProduct ? String(initialProduct.price) : '',
    compareAtPrice: initialProduct?.compareAtPrice ? String(initialProduct.compareAtPrice) : '',
    currency: initialProduct?.currency ?? 'USD',
    stock: initialProduct ? String(initialProduct.stock) : '',
    categoryId: initialProduct?.categoryId ?? categories[0]?.id ?? '',
    isFeatured: initialProduct?.isFeatured ?? false,
    isActive: initialProduct?.isActive ?? true,
  }));
  const [images, setImages] = useState<AdminProductImageInput[]>(
    initialProduct?.images?.map((image) => ({
      url: image.url,
      cloudinaryPublicId: image.cloudinaryPublicId,
      altText: image.altText || '',
      position: image.position,
    })) ?? [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const canDeactivate = mode === 'edit' && Boolean(initialProduct?.id) && form.isActive;

  const imagePreview = useMemo(() => images[0]?.url, [images]);

  function handleField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setServerError('');
    setIsUploading(true);

    try {
      const uploaded = await uploadAdminImage(file, 'products');
      setImages((prev) => [
        {
          url: uploaded.image.url,
          cloudinaryPublicId: uploaded.image.publicId,
          altText: form.name || 'Product image',
          position: 0,
        },
        ...prev.map((image, index) => ({ ...image, position: index + 1 })),
      ]);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  function buildPayload(): AdminProductInput {
    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice) > 0 ? Number(form.compareAtPrice) : undefined,
      currency: form.currency.trim() || 'USD',
      stock: Number(form.stock),
      categoryId: form.categoryId,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      images,
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const payload = buildPayload();

      if (mode === 'create') {
        await createAdminProduct(payload);
        setSuccessMessage('Product created successfully.');
        router.push('/admin/products');
        router.refresh();
        return;
      }

      if (!initialProduct?.id) {
        throw new Error('Missing product id for update');
      }

      await updateAdminProduct(initialProduct.id, payload);
      setSuccessMessage('Product updated successfully.');
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to save product');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!initialProduct?.id) return;

    setServerError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await deactivateAdminProduct(initialProduct.id);
      setSuccessMessage('Product deactivated.');
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Unable to deactivate product');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create Product' : 'Edit Product'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a new product with pricing, category, stock, and image.'
            : 'Update product details and media metadata.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {serverError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-[var(--color-error)]">{serverError}</p>
          ) : null}

          {successMessage ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-[var(--color-success)]">{successMessage}</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="name"
              label="Name"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                handleField('name', name);
                if (mode === 'create') {
                  handleField('slug', slugify(name));
                }
              }}
              required
            />
            <Input
              id="slug"
              label="Slug"
              value={form.slug}
              onChange={(event) => handleField('slug', slugify(event.target.value))}
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
            >
              Description
            </label>
            <textarea
              id="description"
              className="min-h-32 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              value={form.description}
              onChange={(event) => handleField('description', event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              id="price"
              label="Price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(event) => handleField('price', event.target.value)}
              required
            />
            <Input
              id="compareAtPrice"
              label="Compare at price"
              type="number"
              step="0.01"
              min="0"
              value={form.compareAtPrice}
              onChange={(event) => handleField('compareAtPrice', event.target.value)}
            />
            <Input
              id="currency"
              label="Currency"
              value={form.currency}
              onChange={(event) => handleField('currency', event.target.value.toUpperCase())}
              required
            />
            <Input
              id="stock"
              label="Stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => handleField('stock', event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="categoryId"
                className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
              >
                Category
              </label>
              <select
                id="categoryId"
                className="h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                value={form.categoryId}
                onChange={(event) => handleField('categoryId', event.target.value)}
                required
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-6 pb-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => handleField('isFeatured', event.target.checked)}
                />
                Featured product
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => handleField('isActive', event.target.checked)}
                />
                Active
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Product images</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Select one or more images from your computer. Supported formats: JPG, PNG, WebP, GIF, AVIF (max 10 MB each).
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)]">
                {isUploading ? 'Uploading…' : 'Choose image'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isUploading}
                  onChange={handleImageUpload}
                />
              </label>
              {isUploading ? (
                <span className="text-sm text-[var(--color-muted)]">Saving image…</span>
              ) : null}
            </div>

            {images.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <div key={`${image.cloudinaryPublicId}-${index}`} className="relative">
                    <img
                      src={image.url}
                      alt={image.altText || 'Product image'}
                      className="h-28 w-28 rounded-md object-cover ring-1 ring-[var(--color-border)]"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() =>
                        setImages((prev) =>
                          prev
                            .filter((_, i) => i !== index)
                            .map((img, i) => ({ ...img, position: i })),
                        )
                      }
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                    >
                      ×
                    </button>
                    {index === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                        Primary
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting || isUploading}>
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Product'
                  : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Cancel
            </Button>
            {canDeactivate ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeactivate}
                disabled={isSubmitting}
              >
                Deactivate Product
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
