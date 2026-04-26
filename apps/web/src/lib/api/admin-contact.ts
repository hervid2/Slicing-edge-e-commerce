const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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
 * Fetches paginated contact messages. Pass unreadOnly=true to filter to unread only.
 */
export async function listAdminMessages(page = 1, limit = 20, unreadOnly?: boolean) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (unreadOnly) params.set('unread', 'true');
  return request<{
    messages: ContactMessage[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/api/admin/contact?${params.toString()}`, { method: 'GET' });
}

/**
 * Marks a contact message as read.
 */
export async function markMessageRead(id: string) {
  return request<{ message: ContactMessage }>(`/api/admin/contact/${id}/read`, {
    method: 'PATCH',
    body: JSON.stringify({}),
  });
}

/**
 * Permanently deletes a contact message.
 */
export async function deleteMessage(id: string) {
  return request<{ deleted: boolean }>(`/api/admin/contact/${id}`, { method: 'DELETE' });
}
