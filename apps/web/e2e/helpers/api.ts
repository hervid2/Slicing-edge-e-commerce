/**
 * E2E test helpers for direct API interaction.
 * Used to seed test data and clean up after tests without going through the UI.
 */

const API_URL = process.env.E2E_API_URL || 'http://localhost:3001';

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export interface TestOrder {
  orderNumber: string;
  email: string;
}

/**
 * Fetch a JWT token for a user (used for admin API calls in tests).
 */
export async function getAuthToken(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data as { token?: string }).token ?? null;
}

/**
 * Fetch the first available product slug from the public products API.
 */
export async function getFirstProductSlug(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/products?limit=1`);
  if (!res.ok) return null;
  const data = await res.json() as { products?: Array<{ slug: string }> };
  return data.products?.[0]?.slug ?? null;
}

/**
 * Track an order via the public tracking API.
 */
export async function trackOrder(orderNumber: string, email: string) {
  const res = await fetch(`${API_URL}/api/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderNumber, email }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { order?: unknown };
  return data.order ?? null;
}
