import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const showDismissed = searchParams.get("showDismissed") === "true";

    const where: Record<string, unknown> = {};
    if (!showDismissed) where.isDismissed = false;
    if (type) where.type = type;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const summary = {
      total: alerts.length,
      unread: alerts.filter((a) => !a.isRead).length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      warning: alerts.filter((a) => a.severity === "warning").length,
      info: alerts.filter((a) => a.severity === "info").length,
    };

    return NextResponse.json({ alerts, summary });
  } catch (error) {
    console.error("Alerts API error:", error);
    return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, isRead, isDismissed, dismissAll } = body;

    if (dismissAll) {
      await prisma.alert.updateMany({
        where: { isDismissed: false },
        data: { isDismissed: true, isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      const alert = await prisma.alert.update({
        where: { id },
        data: {
          ...(isRead !== undefined && { isRead }),
          ...(isDismissed !== undefined && { isDismissed }),
        },
      });
      return NextResponse.json(alert);
    }

    return NextResponse.json({ error: "ID or dismissAll required" }, { status: 400 });
  } catch (error) {
    console.error("Alert update error:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

// Generate alerts based on current inventory and task state
export async function POST() {
  try {
    // Check for low stock
    const lowStockItems = await prisma.inventory.findMany({
      where: { quantity: { lte: prisma.inventory.fields.minimumThreshold ? 0 : 10 } },
      include: { product: true },
    });

    const inventory = await prisma.inventory.findMany({ include: { product: true } });
    const alerts: { type: string; severity: string; title: string; message: string; entityType: string; entityId: string }[] = [];

    for (const inv of inventory) {
      if (inv.quantity === 0) {
        alerts.push({
          type: "low_stock",
          severity: "critical",
          title: `Out of Stock: ${inv.product.name}`,
          message: `${inv.product.name} (${inv.product.sku}) is out of stock at ${inv.location}`,
          entityType: "inventory",
          entityId: inv.id,
        });
      } else if (inv.quantity <= inv.minimumThreshold) {
        alerts.push({
          type: "low_stock",
          severity: "warning",
          title: `Low Stock: ${inv.product.name}`,
          message: `${inv.product.name} has ${inv.quantity} units remaining at ${inv.location} (min: ${inv.minimumThreshold})`,
          entityType: "inventory",
          entityId: inv.id,
        });
      }
    }

    // Check for overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: "done" },
      },
    });

    for (const task of overdueTasks) {
      alerts.push({
        type: "overdue_task",
        severity: "warning",
        title: `Overdue Task: ${task.title}`,
        message: `Task "${task.title}" is past its due date`,
        entityType: "task",
        entityId: task.id,
      });
    }

    // Create alerts (skip duplicates based on entityId and type)
    let created = 0;
    for (const alert of alerts) {
      const existing = await prisma.alert.findFirst({
        where: {
          type: alert.type,
          entityId: alert.entityId,
          isDismissed: false,
        },
      });
      if (!existing) {
        await prisma.alert.create({ data: alert });
        created++;
      }
    }

    return NextResponse.json({ generated: created, total: alerts.length });
  } catch (error) {
    console.error("Alert generation error:", error);
    return NextResponse.json({ error: "Failed to generate alerts" }, { status: 500 });
  }
}
