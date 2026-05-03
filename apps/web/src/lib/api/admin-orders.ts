const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface AdminOrderItem {
  id: string;
  productName: string;
  productPrice: number | string;
  productImage: string | null;
  quantity: number;
}

export interface AdminOrderStatusHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number | string;
  shippingCost: number | string;
  tax: number | string;
  total: number | string;
  currency: string;
  shippingAddress: Record<string, string>;
  guestEmail: string | null;
  trackingNumber: string | null;
  carrierName: string | null;
  user: { name: string | null; email: string } | null;
  items: AdminOrderItem[];
  statusHistory: AdminOrderStatusHistory[];
  /** Active return request (PENDING/APPROVED/LABEL_ISSUED/RECEIVED), if any. */
  returnRequests: { id: string; status: string }[];
  createdAt: string;
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

  if (!token) {
    throw new Error('Unauthorized. Please sign in again.');
  }

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
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

/**
 * Fetches paginated orders for the admin orders table.
 */
export async function listAdminOrders(page = 1, limit = 20) {
  return request<{ orders: AdminOrder[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/api/admin/orders?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );
}

/**
 * Creates a return request for an order, initiated by an admin.
 * Bypasses customer email verification — admin has full order access.
 */
export async function createAdminReturn(
  orderId: string,
  data: { reason: string; description: string; adminNote?: string },
) {
  return request<{ returnRequest: { id: string; status: string; order: { orderNumber: string } } }>(
    `/api/admin/orders/${orderId}/return`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}

/**
 * Updates an order's status and optionally adds a note, tracking number, and carrier name.
 */
export async function updateAdminOrderStatus(
  orderId: string,
  status: OrderStatus,
  options?: { note?: string; trackingNumber?: string; carrierName?: string },
) {
  return request<{ order: AdminOrder }>(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...options }),
  });
}
