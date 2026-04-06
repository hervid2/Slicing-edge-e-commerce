const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  image: string | null;
  _count: { orders: number };
}

interface SessionLike {
  apiAccessToken?: string;
}

async function getAccessToken() {
  const { getSession } = await import('next-auth/react');
  const session = (await getSession()) as SessionLike | null;
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

/**
 * Fetches paginated users for the admin users table.
 */
export async function listAdminUsers(page = 1, limit = 20) {
  return request<{
    users: AdminUser[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/admin/users?page=${page}&limit=${limit}`, { method: 'GET' });
}

/**
 * Changes a user's role. Admins cannot change their own role.
 */
export async function updateUserRole(userId: string, role: UserRole) {
  return request<{ user: Pick<AdminUser, 'id' | 'name' | 'email' | 'role'> }>(
    `/api/admin/users/${userId}/role`,
    { method: 'PATCH', body: JSON.stringify({ role }) },
  );
}
