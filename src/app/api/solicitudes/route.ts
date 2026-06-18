import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (estado) {
      where.estado = estado;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: "insensitive" } },
        { nombreProducto: { contains: search, mode: "insensitive" } },
        { medico: { nombre: { contains: search, mode: "insensitive" } } },
        { paciente: { nombre: { contains: search, mode: "insensitive" } } },
      ];
    }

    const solicitudes = await prisma.solicitud.findMany({
      where,
      include: {
        medico: {
          select: { id: true, nombre: true, especialidad: true },
        },
        paciente: {
          select: { id: true, nombre: true, dni: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ solicitudes });
  } catch (error) {
    console.error("Solicitudes API error:", error);
    return NextResponse.json({ solicitudes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get or create a default user
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: "No se encontraron usuarios en el sistema" },
        { status: 400 }
      );
    }

    // Generate sequential number: SOL-YYYY-XXXXX
    const year = new Date().getFullYear();
    const count = await prisma.solicitud.count({
      where: {
        numero: { startsWith: `SOL-${year}-` },
      },
    });
    const numero = `SOL-${year}-${String(count + 1).padStart(5, "0")}`;

    const solicitud = await prisma.solicitud.create({
      data: {
        numero,
        medicoId: body.medicoId,
        pacienteId: body.pacienteId,
        estado: "pendiente",

        // Informacion clinica
        diagnosticoPrincipal: body.diagnosticoPrincipal || null,
        diagnosticoSecundario: body.diagnosticoSecundario || null,
        tiempoEvolucion: body.tiempoEvolucion || null,
        tratamientosPrevios: body.tratamientosPrevios || null,
        objetivoTerapeutico: body.objetivoTerapeutico || null,

        // Producto solicitado
        categoriaProducto: body.categoriaProducto || null,
        nombreProducto: body.nombreProducto || null,
        presentacion: body.presentacion || null,
        cantidadSolicitada: body.cantidadSolicitada
          ? parseInt(body.cantidadSolicitada)
          : null,
        numeroViales: body.numeroViales
          ? parseInt(body.numeroViales)
          : null,
        dosisRequerida: body.dosisRequerida || null,
        concentracion: body.concentracion || null,

        // Administracion
        viaAdministracion: body.viaAdministracion || null,
        cantidadAplicar: body.cantidadAplicar || null,
        numSesiones: body.numSesiones
          ? parseInt(body.numSesiones)
          : null,
        fechaAplicacion: body.fechaAplicacion
          ? new Date(body.fechaAplicacion)
          : null,
        lugarAplicacion: body.lugarAplicacion || null,

        // Muestra autologa
        tipoMuestra: body.tipoMuestra || null,
        fechaExtraccion: body.fechaExtraccion
          ? new Date(body.fechaExtraccion)
          : null,
        horaExtraccion: body.horaExtraccion || null,
        lugarExtraccion: body.lugarExtraccion || null,
        profesionalExtraccion: body.profesionalExtraccion || null,
        metodoTransporte: body.metodoTransporte || null,
        temperaturaTransporte: body.temperaturaTransporte || null,

        // Entrega
        nombreReceptor: body.nombreReceptor || null,
        telefonoReceptor: body.telefonoReceptor || null,
        institucionEntrega: body.institucionEntrega || null,
        direccionEntrega: body.direccionEntrega || null,
        ciudadEntrega: body.ciudadEntrega || null,
        provinciaEntrega: body.provinciaEntrega || null,
        cpEntrega: body.cpEntrega || null,
        tipoEntrega: body.tipoEntrega || null,
        fechaRequerida: body.fechaRequerida
          ? new Date(body.fechaRequerida)
          : null,
        horarioPreferido: body.horarioPreferido || null,

        createdById: user.id,
      },
      include: {
        medico: {
          select: { id: true, nombre: true, especialidad: true },
        },
        paciente: {
          select: { id: true, nombre: true, dni: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Log the creation
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "solicitud_creada",
        entityType: "solicitud",
        entityId: solicitud.id,
        details: `Solicitud ${numero} creada para paciente ${solicitud.paciente.nombre}`,
      },
    });

    return NextResponse.json(solicitud, { status: 201 });
  } catch (error) {
    console.error("Solicitud creation error:", error);
    const message =
      error instanceof Error ? error.message : "Error al crear la solicitud";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
