const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DashboardKpis {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeProducts: number;
  totalUsers: number;
}

export interface OrdersByDay {
  date: string;
  count: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
  guestEmail: string | null;
  user: { name: string | null; email: string } | null;
}

export interface LowStockProduct {
  id: string;
  name: string;
  slug: string;
  stock: number;
}

export interface DashboardMetrics {
  kpis: DashboardKpis;
  ordersByDay: OrdersByDay[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
}

/**
 * Fetches admin dashboard metrics. Must be called server-side with a valid admin token.
 */
export async function getAdminMetrics(token: string): Promise<DashboardMetrics> {
  const res = await fetch(`${API_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch metrics');
  }

  return res.json() as Promise<DashboardMetrics>;
}
