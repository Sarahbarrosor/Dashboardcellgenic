import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoria = searchParams.get("categoria");

    const where: Record<string, unknown> = { isActive: true };
    if (categoria && categoria !== "todos") where.categoria = categoria;
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { descripcion: { contains: search, mode: "insensitive" } },
      ];
    }

    const productos = await prisma.producto.findMany({
      where,
      include: {
        inventario: {
          select: { id: true, lote: true, cantidad: true, ubicacion: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    const categorias = await prisma.producto.findMany({
      select: { categoria: true },
      distinct: ["categoria"],
      where: { isActive: true },
    });

    return NextResponse.json({
      productos,
      categorias: categorias.map((c: { categoria: string }) => c.categoria),
    });
  } catch (error) {
    console.error("Productos API error:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sku,
      nombre,
      descripcion,
      categoria,
      presentacion,
      precioUnitario,
      costoUnitario,
      requiereFrio,
    } = body;

    if (!sku || !nombre || !categoria) {
      return NextResponse.json(
        { error: "SKU, nombre y categoría son obligatorios" },
        { status: 400 }
      );
    }

    const existing = await prisma.producto.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un producto con ese SKU" },
        { status: 409 }
      );
    }

    const producto = await prisma.producto.create({
      data: {
        sku,
        nombre,
        descripcion: descripcion || null,
        categoria,
        presentacion: presentacion || null,
        precioUnitario: parseFloat(precioUnitario) || 0,
        costoUnitario: parseFloat(costoUnitario) || 0,
        requiereFrio: requiereFrio ?? true,
      },
    });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
