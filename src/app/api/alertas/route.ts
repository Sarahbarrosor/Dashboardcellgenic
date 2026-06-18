import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get("severity");
    const showDismissed = searchParams.get("showDismissed") === "true";

    const where: Record<string, unknown> = {};
    if (!showDismissed) where.isDismissed = false;
    if (severity) where.severity = severity;

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const allActive = await prisma.alert.findMany({
      where: { isDismissed: false },
    });

    const summary = {
      total: allActive.length,
      unread: allActive.filter((a) => !a.isRead).length,
      critical: allActive.filter((a) => a.severity === "critical").length,
      warning: allActive.filter((a) => a.severity === "warning").length,
      info: allActive.filter((a) => a.severity === "info").length,
    };

    return NextResponse.json({ alerts, summary });
  } catch (error) {
    console.error("Alertas API error:", error);
    return NextResponse.json({
      alerts: [],
      summary: { total: 0, unread: 0, critical: 0, warning: 0, info: 0 },
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID de la alerta" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        isDismissed: true,
        isRead: true,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error al actualizar alerta:", error);
    return NextResponse.json(
      { error: "Error al descartar la alerta" },
      { status: 500 }
    );
  }
}
