import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Attach inventory summary per location
    const inventorySums = await prisma.inventory.groupBy({
      by: ["location"],
      _sum: { quantity: true },
      _count: true,
    });
    const sumMap = Object.fromEntries(
      inventorySums.map((s) => [s.location, { totalItems: s._sum.quantity || 0, productCount: s._count }])
    );

    // Active transfer counts per location
    const activeTransfers = await prisma.transfer.findMany({
      where: { status: { in: ["requested", "approved", "in_transit"] } },
      select: { fromLocationId: true, toLocationId: true, status: true },
    });

    const enriched = locations.map((loc) => {
      const outgoing = activeTransfers.filter((t) => t.fromLocationId === loc.id).length;
      const incoming = activeTransfers.filter((t) => t.toLocationId === loc.id).length;
      return {
        ...loc,
        inventory: sumMap[loc.name] || { totalItems: 0, productCount: 0 },
        activeOutgoing: outgoing,
        activeIncoming: incoming,
      };
    });

    return NextResponse.json({ locations: enriched });
  } catch (error) {
    console.error("Locations API error:", error);
    return NextResponse.json({ error: "Failed to load locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const location = await prisma.location.create({ data: body });
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error("Location creation error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    const location = await prisma.location.update({ where: { id }, data: updates });
    return NextResponse.json(location);
  } catch (error) {
    console.error("Location update error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}
