const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SessionLike {
  apiAccessToken?: string;
}

async function getAccessToken() {
  const { getSession } = await import('next-auth/react');
  const session = (await getSession()) as SessionLike | null;
  return session?.apiAccessToken;
}

async function request<T>(path: string, init: RequestInit) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Unauthorized. Please sign in again.');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

export interface AdminProductImageInput {
  url: string;
  cloudinaryPublicId: string;
  altText?: string;
  position?: number;
}

export interface AdminProductInput {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  images?: AdminProductImageInput[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | string;
  compareAtPrice: number | string | null;
  currency: string;
  stock: number;
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  category?: {
    name?: string;
    slug?: string;
  };
  images: Array<{
    id: string;
    url: string;
    cloudinaryPublicId: string;
    altText: string | null;
    position: number;
  }>;
}

export async function listAdminProducts(page = 1, limit = 50) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return request<{ products: AdminProduct[]; pagination: { total: number; totalPages: number } }>(
    `/api/admin/products?${query.toString()}`,
    {
      method: 'GET',
    },
  );
}

export async function getAdminProduct(id: string) {
  return request<{ product: AdminProduct }>(`/api/admin/products/${id}`, { method: 'GET' });
}

export async function createAdminProduct(body: AdminProductInput) {
  return request<{ product: AdminProduct }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAdminProduct(id: string, body: Partial<AdminProductInput>) {
  return request<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deactivateAdminProduct(id: string) {
  return request<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadAdminImage(file: File, folder = 'products') {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Unauthorized. Please sign in again.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${API_URL}/api/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Upload failed';
    throw new Error(message);
  }

  return data as { image: { url: string; publicId: string } };
}

export async function getCategories() {
  const response = await fetch(`${API_URL}/api/categories`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load categories');
  }
  const data = (await response.json()) as { categories: AdminCategory[] };
  return data.categories;
}
