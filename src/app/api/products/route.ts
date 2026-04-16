import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
      delete where.isActive;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        documents: { orderBy: { createdAt: "desc" } },
        inventory: { select: { location: true, quantity: true } },
      },
      orderBy: { name: "asc" },
    });

    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { isActive: true },
    });

    return NextResponse.json({
      products,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ products: [], categories: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sku, name, description, category, brand, unitPrice, costPrice, locations } = body;

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        category,
        brand: brand || "Cellgenic",
        unitPrice,
        costPrice,
        inventory: locations?.length
          ? {
              create: locations.map((loc: { name: string; quantity: number; threshold: number }) => ({
                location: loc.name,
                quantity: loc.quantity || 0,
                minimumThreshold: loc.threshold || 10,
              })),
            }
          : {
              create: { location: "Main Warehouse", quantity: 0, minimumThreshold: 10 },
            },
      },
      include: { inventory: true, documents: true },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
