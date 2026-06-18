"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  Settings2,
  PackageCheck,
  UserCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn, getSeverityColor } from "@/lib/utils";
import type { DashboardMetrics, SolicitudResumen, AlertData } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  validacion_documental: "Validac. Doc.",
  aprobado: "Aprobado",
  en_preparacion: "En Preparac.",
  despachado: "Despachado",
  entregado: "Entregado",
  cerrado: "Cerrado",
  rechazado: "Rechazado",
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "#eab308",
  validacion_documental: "#3b82f6",
  aprobado: "#22c55e",
  en_preparacion: "#a855f7",
  despachado: "#f97316",
  entregado: "#10b981",
  cerrado: "#6b7280",
  rechazado: "#ef4444",
};

const ESTADO_BADGE_CLASSES: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  validacion_documental: "bg-blue-100 text-blue-800",
  aprobado: "bg-green-100 text-green-800",
  en_preparacion: "bg-purple-100 text-purple-800",
  despachado: "bg-orange-100 text-orange-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cerrado: "bg-gray-100 text-gray-800",
  rechazado: "bg-red-100 text-red-800",
};

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatFechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatFechaHora(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        if (d && typeof d.totalSolicitudes === "number") setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="h-96" />;
  if (!data)
    return (
      <div className="text-center text-gray-500 py-12">
        <p className="text-sm">Datos del dashboard no disponibles.</p>
        <p className="text-xs mt-1">
          La base de datos puede no estar inicializada. Utilice el banner de
          configuracion para cargar datos de prueba.
        </p>
      </div>
    );

  // Ensure all estados appear in the chart, even with zero count
  const allEstados = [
    "pendiente",
    "validacion_documental",
    "aprobado",
    "en_preparacion",
    "despachado",
    "entregado",
    "cerrado",
    "rechazado",
  ];
  const estadoCountMap = new Map(
    data.solicitudesPorEstado.map((e) => [e.estado, e.count])
  );
  const chartData = allEstados.map((estado) => ({
    estado,
    label: ESTADO_LABELS[estado] || estado,
    count: estadoCountMap.get(estado) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Solicitudes"
          value={data.totalSolicitudes.toString()}
          icon={FileText}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Pendientes"
          value={data.solicitudesPendientes.toString()}
          icon={Clock}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <MetricCard
          title="En Proceso"
          value={data.solicitudesEnProceso.toString()}
          icon={Settings2}
          iconColor="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Entregadas"
          value={data.solicitudesEntregadas.toString()}
          icon={PackageCheck}
          iconColor="bg-emerald-100 text-emerald-600"
        />
        <MetricCard
          title="Medicos Validados"
          value={data.medicosValidados.toString()}
          icon={UserCheck}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Pagos Pendientes"
          value={data.pagosPendientes.toString()}
          icon={CreditCard}
          iconColor="bg-red-100 text-red-600"
        />
      </div>

      {/* Chart: Solicitudes por Estado */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-900">
            Solicitudes por Estado
          </h3>
        </div>
        <div className="card-body">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Solicitudes"]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.estado}
                      fill={ESTADO_COLORS[entry.estado] || "#6b7280"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Table + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Solicitudes Table */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">
              Solicitudes Recientes
            </h3>
          </div>
          <div className="card-body p-0">
            {data.solicitudesRecientes.length > 0 ? (
              <div className="table-container border-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>N.o</th>
                      <th>Medico</th>
                      <th>Paciente</th>
                      <th>Producto</th>
                      <th>Estado</th>
                      <th>Monto</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.solicitudesRecientes.map(
                      (sol: SolicitudResumen) => (
                        <tr key={sol.id}>
                          <td className="font-medium text-gray-900">
                            {sol.numero}
                          </td>
                          <td>{sol.medicoNombre}</td>
                          <td>{sol.pacienteNombre}</td>
                          <td className="max-w-[140px] truncate">
                            {sol.producto}
                          </td>
                          <td>
                            <span
                              className={cn(
                                "badge",
                                ESTADO_BADGE_CLASSES[sol.estado] ||
                                  "bg-gray-100 text-gray-800"
                              )}
                            >
                              {ESTADO_LABELS[sol.estado] || sol.estado}
                            </span>
                          </td>
                          <td>
                            {sol.monto != null ? formatARS(sol.monto) : "—"}
                          </td>
                          <td className="text-gray-500">
                            {formatFechaCorta(sol.fecha)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No hay solicitudes registradas
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Alertas Recientes
            </h3>
            <a
              href="/alerts"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Ver todas
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {data.alertasRecientes.length > 0 ? (
              data.alertasRecientes.slice(0, 5).map((alert: AlertData) => (
                <div
                  key={alert.id}
                  className={cn(
                    "px-6 py-3 border-l-4",
                    getSeverityColor(alert.severity)
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">
                        {alert.message}
                      </p>
                    </div>
                    <span className="text-xs whitespace-nowrap opacity-60">
                      {formatFechaHora(alert.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                Sin alertas activas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
