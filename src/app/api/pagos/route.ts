import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    const where: Record<string, unknown> = {};

    if (estado) {
      where.estado = estado;
    }

    const pagos = await prisma.pago.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Stats: totalCobrado = sum of monto where estado=confirmado AND fechaPago in current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const cobradoResult = await prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        estado: "confirmado",
        fechaPago: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const pendientes = await prisma.pago.count({
      where: { estado: "pendiente" },
    });

    const confirmados = await prisma.pago.count({
      where: { estado: "confirmado" },
    });

    return NextResponse.json({
      pagos,
      stats: {
        totalCobrado: cobradoResult._sum.monto || 0,
        pendientes,
        confirmados,
      },
    });
  } catch (error) {
    console.error("Pagos API error:", error);
    return NextResponse.json({
      pagos: [],
      stats: { totalCobrado: 0, pendientes: 0, confirmados: 0 },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pago = await prisma.pago.create({
      data: {
        solicitudNum: body.solicitudNum,
        monto: parseFloat(body.monto),
        metodo: body.metodo,
        comprobante: body.comprobante || null,
        fechaPago: body.fechaPago ? new Date(body.fechaPago) : null,
      },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error("Pago creation error:", error);
    const message =
      error instanceof Error ? error.message : "Error al registrar el pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
