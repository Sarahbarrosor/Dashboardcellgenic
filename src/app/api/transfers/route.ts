import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const fromLocationId = searchParams.get("fromLocationId");
    const toLocationId = searchParams.get("toLocationId");
    const direction = searchParams.get("direction"); // incoming, outgoing, all

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (fromLocationId) where.fromLocationId = fromLocationId;
    if (toLocationId) where.toLocationId = toLocationId;

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        receivedBy: { select: { id: true, name: true } },
        items: {
          include: {
            // include product info
          },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
    });

    // Manually attach products for transfer items (since TransferItem doesn't have product relation)
    const productIds = Array.from(
      new Set(transfers.flatMap((t) => t.items.map((i) => i.productId)))
    );
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, unitPrice: true, costPrice: true },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const enriched = transfers.map((t) => ({
      ...t,
      items: t.items.map((i) => ({ ...i, product: productMap[i.productId] })),
    }));

    const summary = {
      total: transfers.length,
      requested: transfers.filter((t) => t.status === "requested").length,
      approved: transfers.filter((t) => t.status === "approved").length,
      inTransit: transfers.filter((t) => t.status === "in_transit").length,
      received: transfers.filter((t) => t.status === "received").length,
      rejected: transfers.filter((t) => t.status === "rejected").length,
      cancelled: transfers.filter((t) => t.status === "cancelled").length,
    };

    return NextResponse.json({ transfers: enriched, summary });
  } catch (error) {
    console.error("Transfers API error:", error);
    return NextResponse.json({ error: "Failed to load transfers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromLocationId,
      toLocationId,
      priority,
      reason,
      notes,
      items,
      requestedById,
    } = body;

    if (!fromLocationId || !toLocationId || fromLocationId === toLocationId) {
      return NextResponse.json(
        { error: "Valid from/to locations required and must differ" },
        { status: 400 }
      );
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one item required" }, { status: 400 });
    }

    const user = requestedById
      ? await prisma.user.findUnique({ where: { id: requestedById } })
      : await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 400 });

    const [fromLoc, toLoc] = await Promise.all([
      prisma.location.findUnique({ where: { id: fromLocationId } }),
      prisma.location.findUnique({ where: { id: toLocationId } }),
    ]);
    if (!fromLoc || !toLoc) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const count = await prisma.transfer.count();
    const transferNumber = `TRF-${String(count + 1001).padStart(5, "0")}`;

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        fromLocationId,
        toLocationId,
        status: "requested",
        priority: priority || "normal",
        reason,
        notes,
        requestedById: user.id,
        items: {
          create: items.map(
            (item: { productId: string; quantityRequested: number; notes?: string }) => ({
              productId: item.productId,
              quantityRequested: item.quantityRequested,
              notes: item.notes,
            })
          ),
        },
      },
      include: {
        fromLocation: true,
        toLocation: true,
        items: true,
        requestedBy: true,
      },
    });

    // Generate alert to source location
    await prisma.alert.create({
      data: {
        type: "transfer_request",
        severity: priority === "urgent" ? "critical" : "warning",
        title: `Transfer Requested: ${transfer.transferNumber}`,
        message: `${transfer.requestedBy.name} at ${transfer.toLocation.name} is requesting ${items.length} item(s) from ${transfer.fromLocation.name}. Awaiting approval.`,
        entityType: "transfer",
        entityId: transfer.id,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "created",
        entityType: "transfer",
        entityId: transfer.id,
        details: `Requested transfer ${transferNumber} from ${fromLoc.name} to ${toLoc.name}`,
      },
    });

    return NextResponse.json(transfer, { status: 201 });
  } catch (error) {
    console.error("Transfer creation error:", error);
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, trackingNumber, shippingMethod, estimatedArrival, notes, userId, items } = body;

    const existing = await prisma.transfer.findUnique({
      where: { id },
      include: { fromLocation: true, toLocation: true, items: true },
    });
    if (!existing) return NextResponse.json({ error: "Transfer not found" }, { status: 404 });

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (shippingMethod !== undefined) updateData.shippingMethod = shippingMethod;
    if (estimatedArrival !== undefined) updateData.estimatedArrival = estimatedArrival ? new Date(estimatedArrival) : null;
    if (notes !== undefined) updateData.notes = notes;

    // Status transitions trigger appropriate timestamps & inventory changes
    if (status === "approved") {
      updateData.approvedAt = new Date();
      updateData.approvedById = user?.id;
    } else if (status === "in_transit") {
      updateData.shippedAt = new Date();
      if (!existing.approvedAt) updateData.approvedAt = new Date();
      if (!existing.approvedById) updateData.approvedById = user?.id;

      // Deduct stock from source location when items ship
      for (const item of existing.items) {
        const qtyShipped = items?.find((i: { id: string }) => i.id === item.id)?.quantityShipped ?? item.quantityRequested;
        const inv = await prisma.inventory.findUnique({
          where: {
            productId_location: {
              productId: item.productId,
              location: existing.fromLocation.name,
            },
          },
        });
        if (inv) {
          await prisma.inventory.update({
            where: { id: inv.id },
            data: { quantity: Math.max(0, inv.quantity - qtyShipped) },
          });
        }
        await prisma.transferItem.update({
          where: { id: item.id },
          data: { quantityShipped: qtyShipped },
        });
      }

      // Alert receiving location
      await prisma.alert.create({
        data: {
          type: "transfer_incoming",
          severity: "info",
          title: `Incoming Shipment: ${existing.transferNumber}`,
          message: `${existing.items.length} item(s) now in transit from ${existing.fromLocation.name} → ${existing.toLocation.name}${trackingNumber ? ` (${trackingNumber})` : ""}.`,
          entityType: "transfer",
          entityId: existing.id,
        },
      });
    } else if (status === "received") {
      updateData.receivedAt = new Date();
      updateData.receivedById = user?.id;

      // Add stock to destination location when items are received
      for (const item of existing.items) {
        const qtyReceived = items?.find((i: { id: string }) => i.id === item.id)?.quantityReceived
          ?? item.quantityShipped
          ?? item.quantityRequested;
        const inv = await prisma.inventory.findUnique({
          where: {
            productId_location: {
              productId: item.productId,
              location: existing.toLocation.name,
            },
          },
        });
        if (inv) {
          await prisma.inventory.update({
            where: { id: inv.id },
            data: { quantity: inv.quantity + qtyReceived, lastRestocked: new Date() },
          });
        } else {
          await prisma.inventory.create({
            data: {
              productId: item.productId,
              location: existing.toLocation.name,
              quantity: qtyReceived,
              lastRestocked: new Date(),
            },
          });
        }
        await prisma.transferItem.update({
          where: { id: item.id },
          data: { quantityReceived: qtyReceived },
        });
      }

      // Dismiss related incoming alerts
      await prisma.alert.updateMany({
        where: { entityType: "transfer", entityId: existing.id, isDismissed: false },
        data: { isDismissed: true },
      });
    } else if (status === "rejected" || status === "cancelled") {
      // Dismiss any pending alerts
      await prisma.alert.updateMany({
        where: { entityType: "transfer", entityId: existing.id, isDismissed: false },
        data: { isDismissed: true },
      });
    }

    const updated = await prisma.transfer.update({
      where: { id },
      data: updateData,
      include: {
        fromLocation: true,
        toLocation: true,
        items: true,
        requestedBy: true,
        approvedBy: true,
        receivedBy: true,
      },
    });

    if (status) {
      await prisma.activityLog.create({
        data: {
          userId: user?.id,
          action: "status_changed",
          entityType: "transfer",
          entityId: id,
          details: `Transfer ${existing.transferNumber} status changed to ${status}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Transfer update error:", error);
    return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });
  }
}
