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
        { nombre: { contains: search, mode: "insensitive" } },
        { dni: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { especialidad: { contains: search, mode: "insensitive" } },
        { institucion: { contains: search, mode: "insensitive" } },
        { ciudad: { contains: search, mode: "insensitive" } },
      ];
    }

    const medicos = await prisma.medico.findMany({
      where,
      include: {
        _count: {
          select: {
            solicitudes: true,
            pacientes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ medicos });
  } catch (error) {
    console.error("Medicos API error:", error);
    return NextResponse.json({ medicos: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const medico = await prisma.medico.create({
      data: {
        nombre: body.nombre,
        dni: body.dni,
        matriculaNacional: body.matriculaNacional || null,
        matriculaProvincial: body.matriculaProvincial || null,
        especialidad: body.especialidad || null,
        subespecialidad: body.subespecialidad || null,
        institucion: body.institucion || null,
        cargo: body.cargo || null,
        telefono: body.telefono || null,
        whatsapp: body.whatsapp || null,
        email: body.email,
        direccion: body.direccion || null,
        ciudad: body.ciudad || null,
        provincia: body.provincia || null,
        codigoPostal: body.codigoPostal || null,
        miembroSAMHRE: body.miembroSAMHRE || false,
        numMiembroSAMHRE: body.numMiembroSAMHRE || null,
        certificadoISSCA: body.certificadoISSCA || false,
        numCertificadoISSCA: body.numCertificadoISSCA || null,
        workshopCellgenic: body.workshopCellgenic || false,
        fechaWorkshop: body.fechaWorkshop ? new Date(body.fechaWorkshop) : null,
        otraFormacion: body.otraFormacion || null,
        estado: body.estado || "pendiente",
      },
      include: {
        _count: {
          select: {
            solicitudes: true,
            pacientes: true,
          },
        },
      },
    });

    return NextResponse.json(medico, { status: 201 });
  } catch (error) {
    console.error("Medico creation error:", error);
    return NextResponse.json(
      { error: "Error al crear el medico" },
      { status: 500 }
    );
  }
}
