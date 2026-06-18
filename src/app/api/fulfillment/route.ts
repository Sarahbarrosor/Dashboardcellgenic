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

    const fulfillments = await prisma.fulfillment.findMany({
      where,
      include: {
        solicitud: {
          include: {
            medico: true,
            paciente: true,
          },
        },
        responsable: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ fulfillments });
  } catch (error) {
    console.error("Fulfillment API error:", error);
    return NextResponse.json({ fulfillments: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, estado, loteAsignado, productoReservado, cantidad, metodoEnvio, tracking, temperaturaEnvio, ubicacion } = body;

    const updateData: Record<string, unknown> = { estado };

    if (estado === "preparando") {
      updateData.fechaPreparacion = new Date();
      if (loteAsignado !== undefined) updateData.loteAsignado = loteAsignado;
      if (productoReservado !== undefined) updateData.productoReservado = productoReservado;
      if (cantidad !== undefined) updateData.cantidad = cantidad;
      if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
    }

    if (estado === "despachado") {
      updateData.fechaDespacho = new Date();
      if (metodoEnvio !== undefined) updateData.metodoEnvio = metodoEnvio;
      if (tracking !== undefined) updateData.tracking = tracking;
      if (temperaturaEnvio !== undefined) updateData.temperaturaEnvio = temperaturaEnvio;
    }

    const fulfillment = await prisma.fulfillment.update({
      where: { id },
      data: updateData,
      include: {
        solicitud: {
          include: {
            medico: true,
            paciente: true,
          },
        },
        responsable: true,
      },
    });

    if (estado === "entregado") {
      await prisma.solicitud.update({
        where: { id: fulfillment.solicitudId },
        data: { estado: "entregado" },
      });
    }

    return NextResponse.json(fulfillment);
  } catch (error) {
    console.error("Fulfillment PATCH error:", error);
    const message = error instanceof Error ? error.message : "Error al actualizar el fulfillment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
