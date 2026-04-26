const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  position: number;
  isActive: boolean;
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

/**
 * Fetches all FAQ entries for admin management (includes inactive).
 */
export async function listAdminFaq() {
  return request<{ entries: FaqEntry[] }>('/api/admin/faq', { method: 'GET' });
}

/**
 * Creates a new FAQ entry.
 */
export async function createFaqEntry(data: {
  question: string;
  answer: string;
  position?: number;
  isActive?: boolean;
}) {
  return request<{ entry: FaqEntry }>('/api/admin/faq', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Updates an existing FAQ entry.
 */
export async function updateFaqEntry(
  id: string,
  data: { question?: string; answer?: string; position?: number; isActive?: boolean },
) {
  return request<{ entry: FaqEntry }>(`/api/admin/faq/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Permanently deletes a FAQ entry.
 */
export async function deleteFaqEntry(id: string) {
  return request<{ deleted: boolean }>(`/api/admin/faq/${id}`, { method: 'DELETE' });
}
