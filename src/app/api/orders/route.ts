import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { supplierName: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    };

    return NextResponse.json({ orders, summary });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ orders: [], summary: { total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, totalValue: 0 } });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, customerName, customerEmail, supplierName, notes, items } = body;

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No users found" }, { status: 400 });

    // Generate order number
    const count = await prisma.order.count();
    const prefix = type === "purchase" ? "PO" : type === "internal" ? "IO" : "SO";
    const orderNumber = `${prefix}-${String(count + 1001).padStart(5, "0")}`;

    // Calculate total
    const totalAmount = items?.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    ) || 0;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        type: type || "sales",
        customerName,
        customerEmail,
        supplierName,
        notes,
        totalAmount,
        createdById: user.id,
        items: items?.length
          ? {
              create: items.map(
                (item: { productId: string; quantity: number; unitPrice: number }) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.quantity * item.unitPrice,
                })
              ),
            }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        comments: true,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    // Log the status change
    if (status) {
      await prisma.activityLog.create({
        data: {
          action: "status_changed",
          entityType: "order",
          entityId: id,
          details: `Order status changed to ${status}`,
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
