const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
  _count: { products: number };
  createdAt: string;
  updatedAt: string;
}

async function getAccessToken() {
  const { getSession } = await import('next-auth/react');
  const session = (await getSession()) as { apiAccessToken?: string } | null;
  return session?.apiAccessToken;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error('Unauthorized. Please sign in again.');

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

/** Fetches all categories for admin management (includes inactive). */
export async function listAdminCategories() {
  return request<{ categories: AdminCategory[] }>('/api/admin/categories', { method: 'GET' });
}

/** Creates a new category. */
export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  position?: number;
}) {
  return request<{ category: AdminCategory }>('/api/categories', {
    method: 'POST',
    body: JSON.stringify({ ...data, isActive: true }),
  });
}

/** Updates an existing category (name, slug, description, position, isActive). */
export async function updateCategory(
  id: string,
  data: { name?: string; slug?: string; description?: string; position?: number; isActive?: boolean },
) {
  return request<{ category: AdminCategory }>(`/api/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
