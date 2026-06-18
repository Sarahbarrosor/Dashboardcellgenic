import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalSolicitudes,
      solicitudesPendientes,
      solicitudesEnProceso,
      solicitudesEntregadas,
      medicosValidados,
      pagosPendientes,
      solicitudesPorEstado,
      solicitudesRecientes,
      alertasRecientes,
    ] = await Promise.all([
      prisma.solicitud.count().catch(() => 0),
      prisma.solicitud.count({ where: { estado: "pendiente" } }).catch(() => 0),
      prisma.solicitud
        .count({
          where: {
            estado: {
              in: ["validacion_documental", "aprobado", "en_preparacion", "despachado"],
            },
          },
        })
        .catch(() => 0),
      prisma.solicitud.count({ where: { estado: "entregado" } }).catch(() => 0),
      prisma.medico.count({ where: { estado: "validado" } }).catch(() => 0),
      prisma.pago.count({ where: { estado: "pendiente" } }).catch(() => 0),
      prisma.solicitud
        .groupBy({
          by: ["estado"],
          _count: { estado: true },
        })
        .catch(() => []),
      prisma.solicitud
        .findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            medico: { select: { nombre: true } },
            paciente: { select: { nombre: true } },
          },
        })
        .catch(() => []),
      prisma.alert
        .findMany({
          where: { isDismissed: false },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
        .catch(() => []),
    ]);

    const estadosData = (
      solicitudesPorEstado as { estado: string; _count: { estado: number } }[]
    ).map((item) => ({
      estado: item.estado,
      count: item._count.estado,
    }));

    const recientes = (
      solicitudesRecientes as {
        id: string;
        numero: string;
        estado: string;
        nombreProducto: string | null;
        montoTotal: number | null;
        createdAt: Date;
        medico: { nombre: string };
        paciente: { nombre: string };
      }[]
    ).map((s) => ({
      id: s.id,
      numero: s.numero,
      estado: s.estado,
      medicoNombre: s.medico.nombre,
      pacienteNombre: s.paciente.nombre,
      producto: s.nombreProducto || "—",
      fecha: s.createdAt.toISOString(),
      monto: s.montoTotal,
    }));

    const alertas = (
      alertasRecientes as {
        id: string;
        type: string;
        severity: string;
        title: string;
        message: string;
        entityType: string | null;
        entityId: string | null;
        isRead: boolean;
        createdAt: Date;
      }[]
    ).map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
      entityType: a.entityType,
      entityId: a.entityId,
      isRead: a.isRead,
      createdAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalSolicitudes,
      solicitudesPendientes,
      solicitudesEnProceso,
      solicitudesEntregadas,
      medicosValidados,
      pagosPendientes,
      solicitudesPorEstado: estadosData,
      solicitudesRecientes: recientes,
      alertasRecientes: alertas,
    } satisfies DashboardResponse);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      totalSolicitudes: 0,
      solicitudesPendientes: 0,
      solicitudesEnProceso: 0,
      solicitudesEntregadas: 0,
      medicosValidados: 0,
      pagosPendientes: 0,
      solicitudesPorEstado: [],
      solicitudesRecientes: [],
      alertasRecientes: [],
    } satisfies DashboardResponse);
  }
}

interface DashboardResponse {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesEnProceso: number;
  solicitudesEntregadas: number;
  medicosValidados: number;
  pagosPendientes: number;
  solicitudesPorEstado: { estado: string; count: number }[];
  solicitudesRecientes: {
    id: string;
    numero: string;
    estado: string;
    medicoNombre: string;
    pacienteNombre: string;
    producto: string;
    fecha: string;
    monto: number | null;
  }[];
  alertasRecientes: {
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    isRead: boolean;
    createdAt: string;
  }[];
}
