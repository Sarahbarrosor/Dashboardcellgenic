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

    const evidencias = await prisma.evidenciaEntrega.findMany({
      where,
      include: {
        solicitud: {
          include: {
            medico: true,
            paciente: true,
          },
        },
        creadoPor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const solicitudesDisponibles = await prisma.solicitud.findMany({
      where: { estado: "despachado", evidencia: null },
      include: { medico: true, paciente: true },
      orderBy: { numero: "asc" },
    });

    return NextResponse.json({ evidencias, solicitudesDisponibles });
  } catch (error) {
    console.error("Evidencia API GET error:", error);
    return NextResponse.json({ evidencias: [], solicitudesDisponibles: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let user = await prisma.user.findFirst({ where: { role: "admin" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Sistema",
          email: "sistema@cellgenic.com",
          role: "admin",
        },
      });
    }

    const evidencia = await prisma.evidenciaEntrega.create({
      data: {
        solicitudId: body.solicitudId,
        nombreReceptor: body.nombreReceptor || null,
        dniReceptor: body.dniReceptor || null,
        fechaHoraEntrega: body.fechaHoraEntrega
          ? new Date(body.fechaHoraEntrega)
          : null,
        observaciones: body.observaciones || null,
        estado: "pendiente",
        creadoPorId: user.id,
      },
      include: {
        solicitud: {
          include: {
            medico: true,
            paciente: true,
          },
        },
        creadoPor: true,
      },
    });

    return NextResponse.json(evidencia, { status: 201 });
  } catch (error) {
    console.error("Evidencia API POST error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al crear la evidencia de entrega";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const evidencia = await prisma.evidenciaEntrega.update({
      where: { id: body.id },
      data: { estado: body.estado },
      include: {
        solicitud: {
          include: {
            medico: true,
            paciente: true,
          },
        },
        creadoPor: true,
      },
    });

    if (body.estado === "confirmada") {
      await prisma.solicitud.update({
        where: { id: evidencia.solicitudId },
        data: { estado: "entregado" },
      });
    }

    return NextResponse.json(evidencia);
  } catch (error) {
    console.error("Evidencia API PATCH error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error al actualizar la evidencia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
