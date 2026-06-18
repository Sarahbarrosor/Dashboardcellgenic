import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const medicoId = searchParams.get("medicoId");

    const where: Record<string, unknown> = {};
    if (medicoId) {
      where.medicoId = medicoId;
    }
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { dni: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { telefono: { contains: search } },
      ];
    }

    const pacientes = await prisma.paciente.findMany({
      where,
      include: {
        medico: { select: { id: true, nombre: true } },
        _count: { select: { solicitudes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pacientes });
  } catch (error) {
    console.error("Pacientes API error:", error);
    return NextResponse.json({ pacientes: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      nombre,
      dni,
      fechaNacimiento,
      edad,
      sexo,
      peso,
      altura,
      telefono,
      email,
      medicoId,
    } = body;

    if (!nombre || !dni || !medicoId) {
      return NextResponse.json(
        { error: "Nombre, DNI y Médico son obligatorios" },
        { status: 400 }
      );
    }

    const paciente = await prisma.paciente.create({
      data: {
        nombre,
        dni,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        edad: edad ? parseInt(edad, 10) : null,
        sexo: sexo || null,
        peso: peso || null,
        altura: altura || null,
        telefono: telefono || null,
        email: email || null,
        medicoId,
      },
      include: {
        medico: { select: { id: true, nombre: true } },
        _count: { select: { solicitudes: true } },
      },
    });

    return NextResponse.json(paciente, { status: 201 });
  } catch (error) {
    console.error("Paciente creation error:", error);
    return NextResponse.json(
      { error: "Error al crear el paciente" },
      { status: 500 }
    );
  }
}
