const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CartUiItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
}

interface ApiCart {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number | string;
      stock: number;
      images?: Array<{ url: string }>;
    };
  }>;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const maybeMessage = (data as { message?: unknown }).message;
  return typeof maybeMessage === 'string' && maybeMessage.length > 0 ? maybeMessage : fallback;
}

async function request<T>(path: string, init: RequestInit, sessionId: string) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': sessionId,
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(getErrorMessage(data, 'Request failed'));
  }

  return data as T;
}

export function mapCartItems(cart: ApiCart | null | undefined): CartUiItem[] {
  if (!cart) return [];

  return cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: Number(item.product.price),
    imageUrl: item.product.images?.[0]?.url,
    quantity: item.quantity,
    stock: item.product.stock,
  }));
}

export async function getCart(sessionId: string) {
  return request<{ cart: ApiCart }>(
    '/api/cart',
    {
      method: 'GET',
    },
    sessionId,
  );
}

export async function addCartItem(sessionId: string, productId: string, quantity: number) {
  return request<{ item: unknown }>(
    '/api/cart/items',
    {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    },
    sessionId,
  );
}

export async function updateCartItem(sessionId: string, itemId: string, quantity: number) {
  return request<{ item: unknown }>(
    `/api/cart/items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    },
    sessionId,
  );
}

export async function removeCartItem(sessionId: string, itemId: string) {
  const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'x-session-id': sessionId,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(getErrorMessage(data, 'Unable to remove item'));
  }
}

export async function createCheckout(
  sessionId: string,
  body: {
    guestEmail: string;
    shippingAddress: {
      fullName: string;
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      phone?: string;
    };
  },
) {
  return request<{ order: { orderNumber: string } }>(
    '/api/checkout',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    sessionId,
  );
}
