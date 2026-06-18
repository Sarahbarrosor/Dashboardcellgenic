import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function calcularEstado(cantidad: number, umbralMinimo: number) {
  if (cantidad === 0) return "agotado";
  if (cantidad <= umbralMinimo) return "critico";
  if (cantidad <= umbralMinimo * 2) return "bajo";
  return "ok";
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get("categoria");
    const search = searchParams.get("search");
    const almacenamiento = searchParams.get("almacenamiento");

    const where: Record<string, unknown> = {};

    if (almacenamiento && almacenamiento !== "todos") {
      where.tipoAlmacenamiento = almacenamiento;
    }

    if (categoria && categoria !== "todos") {
      where.producto = { categoria };
    }

    if (search) {
      where.producto = {
        ...(typeof where.producto === "object" ? where.producto : {}),
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const inventario = await prisma.inventario.findMany({
      where,
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            sku: true,
            categoria: true,
            presentacion: true,
            precioUnitario: true,
            costoUnitario: true,
            requiereFrio: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const ahora = new Date();
    const en30Dias = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);

    const items = inventario.map((inv: typeof inventario[number]) => {
      const estado = calcularEstado(inv.cantidad, inv.umbralMinimo);
      const proximoAVencer =
        inv.fechaVencimiento != null && new Date(inv.fechaVencimiento) <= en30Dias;
      return { ...inv, estado, proximoAVencer };
    });

    const stockTotal = items.reduce((sum: number, i: { cantidad: number }) => sum + i.cantidad, 0);
    const stockBajo = items.filter(
      (i: { estado: string }) => i.estado === "bajo" || i.estado === "critico"
    ).length;
    const vencimientosProximos = items.filter((i: { proximoAVencer: boolean }) => i.proximoAVencer).length;

    return NextResponse.json({
      items,
      resumen: {
        totalProductos: items.length,
        stockTotal,
        stockBajo,
        vencimientosProximos,
      },
    });
  } catch (error) {
    console.error("Inventario API error:", error);
    return NextResponse.json(
      {
        items: [],
        resumen: {
          totalProductos: 0,
          stockTotal: 0,
          stockBajo: 0,
          vencimientosProximos: 0,
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productoId,
      lote,
      cantidad,
      fechaVencimiento,
      ubicacion,
      tipoAlmacenamiento,
      umbralMinimo,
    } = body;

    if (!productoId || !lote || cantidad == null) {
      return NextResponse.json(
        { error: "productoId, lote y cantidad son obligatorios" },
        { status: 400 }
      );
    }

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    });
    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    const inventario = await prisma.inventario.create({
      data: {
        productoId,
        lote,
        cantidad: parseInt(String(cantidad), 10),
        fechaVencimiento: fechaVencimiento
          ? new Date(fechaVencimiento)
          : null,
        ubicacion: ubicacion || "Laboratorio Principal",
        tipoAlmacenamiento: tipoAlmacenamiento || "frio",
        umbralMinimo: parseInt(String(umbralMinimo), 10) || 5,
      },
      include: {
        producto: true,
      },
    });

    return NextResponse.json(inventario, { status: 201 });
  } catch (error) {
    console.error("Error al crear inventario:", error);
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "Ya existe un registro de inventario con ese producto y lote"
        : "Error al crear registro de inventario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
