import type { PrismaClient } from '@slicing-edge/db';

const LOW_STOCK_THRESHOLD = 10;
const RECENT_ORDERS_LIMIT = 8;

/**
 * Aggregates store-wide KPI data for the admin dashboard.
 */
export class MetricsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardMetrics() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOrders,
      pendingOrders,
      revenueResult,
      activeProducts,
      totalUsers,
      recentOrdersRaw,
      lowStockProducts,
      ordersLast30Days,
    ] = await Promise.all([
      // Total order count
      this.prisma.order.count(),

      // Pending orders (need attention)
      this.prisma.order.count({ where: { status: 'PENDING' } }),

      // Total revenue from non-cancelled orders
      this.prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),

      // Active product count
      this.prisma.product.count({ where: { isActive: true } }),

      // Total registered users (customers + admins)
      this.prisma.user.count(),

      // Recent orders
      this.prisma.order.findMany({
        take: RECENT_ORDERS_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          currency: true,
          createdAt: true,
          guestEmail: true,
          user: { select: { name: true, email: true } },
        },
      }),

      // Low-stock products
      this.prisma.product.findMany({
        where: { isActive: true, stock: { gt: 0, lt: LOW_STOCK_THRESHOLD } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, slug: true, stock: true },
      }),

      // Orders created in the last 30 days for the chart
      this.prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Build orders-by-day for the last 30 days (fills gaps with 0)
    const countByDay = ordersLast30Days.reduce<Record<string, number>>((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0]!;
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {});

    const ordersByDay: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0]!;
      ordersByDay.push({ date, count: countByDay[date] ?? 0 });
    }

    return {
      kpis: {
        totalOrders,
        pendingOrders,
        totalRevenue: Number(revenueResult._sum.total ?? 0),
        activeProducts,
        totalUsers,
      },
      ordersByDay,
      recentOrders: recentOrdersRaw.map((o) => ({
        ...o,
        total: Number(o.total),
      })),
      lowStockProducts,
    };
  }
}
