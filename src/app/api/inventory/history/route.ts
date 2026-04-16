import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const location = searchParams.get("location");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {};
    if (productId) where.productId = productId;
    if (location) where.location = location;

    const [history, syncLogs] = await Promise.all([
      prisma.inventoryHistory.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.syncLog.findMany({
        orderBy: { startedAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({ history, syncLogs });
  } catch (error) {
    console.error("Inventory history error:", error);
    return NextResponse.json({ history: [], syncLogs: [] });
  }
}
