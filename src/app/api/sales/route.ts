import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "90");
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [sales, allTimeSales, productSales, channelSales] = await Promise.all([
      prisma.saleRecord.findMany({
        where: { saleDate: { gte: startDate } },
        include: { product: { select: { id: true, name: true, sku: true, category: true } } },
        orderBy: { saleDate: "desc" },
      }),
      prisma.saleRecord.aggregate({
        _sum: { totalAmount: true, quantity: true },
        _count: true,
      }),
      prisma.saleRecord.groupBy({
        by: ["productId"],
        where: { saleDate: { gte: startDate } },
        _sum: { totalAmount: true, quantity: true },
        _count: true,
        orderBy: { _sum: { totalAmount: "desc" } },
        take: 20,
      }),
      prisma.saleRecord.groupBy({
        by: ["channel"],
        where: { saleDate: { gte: startDate } },
        _sum: { totalAmount: true, quantity: true },
        _count: true,
      }),
    ]);

    // Get product details for top products
    const productIds = productSales.map((ps) => ps.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, category: true },
    });

    const topProducts = productSales.map((ps) => {
      const product = products.find((p) => p.id === ps.productId);
      return {
        productId: ps.productId,
        name: product?.name || "Unknown",
        sku: product?.sku || "",
        category: product?.category || "",
        totalRevenue: ps._sum.totalAmount || 0,
        totalQuantity: ps._sum.quantity || 0,
        orderCount: ps._count,
      };
    });

    // Build monthly trend
    const monthlyMap = new Map<string, { revenue: number; quantity: number; orders: number }>();
    for (const sale of sales) {
      const month = new Date(sale.saleDate).toISOString().slice(0, 7);
      const entry = monthlyMap.get(month) || { revenue: 0, quantity: 0, orders: 0 };
      entry.revenue += sale.totalAmount;
      entry.quantity += sale.quantity;
      entry.orders += 1;
      monthlyMap.set(month, entry);
    }
    const monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));

    // Category breakdown
    const categoryMap = new Map<string, { revenue: number; quantity: number }>();
    for (const sale of sales) {
      const cat = sale.product.category;
      const entry = categoryMap.get(cat) || { revenue: 0, quantity: 0 };
      entry.revenue += sale.totalAmount;
      entry.quantity += sale.quantity;
      categoryMap.set(cat, entry);
    }
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalOrders = sales.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalQuantitySold: sales.reduce((sum, s) => sum + s.quantity, 0),
        allTimeRevenue: allTimeSales._sum.totalAmount || 0,
        allTimeOrders: allTimeSales._count,
      },
      topProducts,
      channelBreakdown: channelSales.map((cs) => ({
        channel: cs.channel,
        revenue: cs._sum.totalAmount || 0,
        quantity: cs._sum.quantity || 0,
        orders: cs._count,
      })),
      categoryBreakdown,
      monthlyTrend,
      recentSales: sales.slice(0, 50),
    });
  } catch (error) {
    console.error("Sales API error:", error);
    return NextResponse.json({ summary: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalQuantitySold: 0, allTimeRevenue: 0, allTimeOrders: 0 }, topProducts: [], channelBreakdown: [], categoryBreakdown: [], monthlyTrend: [], recentSales: [] });
  }
}
