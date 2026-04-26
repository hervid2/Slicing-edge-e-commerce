const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface ReturnRequest {
  id: string;
  orderId: string;
  email: string;
  reason: string;
  description: string;
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  order: { orderNumber: string; total: string };
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

/**
 * Fetches paginated return requests. Supports optional status filter.
 */
export async function listAdminReturns(page = 1, limit = 20, status?: ReturnStatus) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  return request<{
    returns: ReturnRequest[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/admin/returns?${params.toString()}`, { method: 'GET' });
}

/**
 * Updates the status of a return request and optionally records an admin note.
 */
export async function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  adminNote?: string,
) {
  return request<{ returnRequest: ReturnRequest }>(`/api/admin/returns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote }),
  });
}
