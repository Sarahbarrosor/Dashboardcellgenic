import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (location) where.location = location;
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
        ],
      };
    }

    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitPrice: true,
            costPrice: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const items = inventory.map((inv) => {
      let itemStatus: string;
      if (inv.quantity === 0) itemStatus = "out_of_stock";
      else if (inv.quantity <= inv.minimumThreshold) itemStatus = "critical";
      else if (inv.quantity <= inv.reorderPoint) itemStatus = "low";
      else itemStatus = "ok";

      return { ...inv, status: itemStatus };
    });

    const filtered = status ? items.filter((i) => i.status === status) : items;

    // Get unique locations for filter
    const locations = await prisma.inventory.findMany({
      select: { location: true },
      distinct: ["location"],
    });

    return NextResponse.json({
      items: filtered,
      locations: locations.map((l) => l.location),
      summary: {
        total: items.length,
        ok: items.filter((i) => i.status === "ok").length,
        low: items.filter((i) => i.status === "low").length,
        critical: items.filter((i) => i.status === "critical").length,
        outOfStock: items.filter((i) => i.status === "out_of_stock").length,
      },
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json({ items: [], locations: [], summary: { total: 0, ok: 0, low: 0, critical: 0, outOfStock: 0 } });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity, minimumThreshold, reorderPoint, reorderQuantity } = body;

    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(minimumThreshold !== undefined && { minimumThreshold }),
        ...(reorderPoint !== undefined && { reorderPoint }),
        ...(reorderQuantity !== undefined && { reorderQuantity }),
        ...(quantity !== undefined && { lastRestocked: new Date() }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Inventory update error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
