import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProducts,
      inventoryData,
      pendingOrders,
      pendingTasks,
      recentSales,
      previousMonthSales,
      topProductSales,
      recentAlerts,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.inventory.findMany({ include: { product: true } }),
      prisma.order.count({ where: { status: { in: ["pending", "confirmed", "processing"] } } }),
      prisma.task.count({ where: { status: { in: ["todo", "in_progress"] } } }),
      prisma.saleRecord.findMany({ where: { saleDate: { gte: thirtyDaysAgo } } }),
      prisma.saleRecord.findMany({
        where: {
          saleDate: {
            gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
            lt: thirtyDaysAgo,
          },
        },
      }),
      prisma.saleRecord.groupBy({
        by: ["productId"],
        _sum: { quantity: true, totalAmount: true },
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 5,
      }),
      prisma.alert.findMany({
        where: { isDismissed: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    // Calculate inventory metrics
    const totalInventoryValue = inventoryData.reduce(
      (sum, inv) => sum + inv.quantity * inv.product.costPrice,
      0
    );
    const lowStockCount = inventoryData.filter(
      (inv) => inv.quantity <= inv.minimumThreshold && inv.quantity > 0
    ).length;
    const outOfStockCount = inventoryData.filter((inv) => inv.quantity === 0).length;

    // Revenue calculations
    const monthlyRevenue = recentSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const previousRevenue = previousMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const revenueChange = previousRevenue > 0
      ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    // Top products with details
    const topProductIds = topProductSales.map((tp) => tp.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });
    const topProducts = topProductSales.map((tp) => {
      const product = topProductDetails.find((p) => p.id === tp.productId);
      return {
        id: tp.productId,
        name: product?.name || "Unknown",
        sku: product?.sku || "",
        totalSold: tp._sum.quantity || 0,
        revenue: tp._sum.totalAmount || 0,
      };
    });

    // Sales trend (last 30 days, grouped by day)
    const salesByDay = new Map<string, { revenue: number; orders: number }>();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split("T")[0];
      salesByDay.set(key, { revenue: 0, orders: 0 });
    }
    for (const sale of recentSales) {
      const key = new Date(sale.saleDate).toISOString().split("T")[0];
      const entry = salesByDay.get(key);
      if (entry) {
        entry.revenue += sale.totalAmount;
        entry.orders += 1;
      }
    }
    const salesTrend = Array.from(salesByDay.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));

    // Inventory by location
    const locationMap = new Map<string, { totalItems: number; totalValue: number; lowStockItems: number }>();
    for (const inv of inventoryData) {
      const loc = locationMap.get(inv.location) || { totalItems: 0, totalValue: 0, lowStockItems: 0 };
      loc.totalItems += inv.quantity;
      loc.totalValue += inv.quantity * inv.product.costPrice;
      if (inv.quantity <= inv.minimumThreshold) loc.lowStockItems++;
      locationMap.set(inv.location, loc);
    }
    const inventoryByLocation = Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      ...data,
    }));

    return NextResponse.json({
      totalProducts,
      totalInventoryValue,
      lowStockCount: lowStockCount + outOfStockCount,
      pendingOrders,
      pendingTasks,
      monthlyRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      topProducts,
      recentAlerts,
      salesTrend,
      inventoryByLocation,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
