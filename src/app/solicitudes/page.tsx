"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  Eye,
  Calendar,
  User,
  Stethoscope,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";

interface SolicitudListItem {
  id: string;
  numero: string;
  estado: string;
  estadoPago: string | null;
  categoriaProducto: string | null;
  nombreProducto: string | null;
  createdAt: string;
  medico: { id: string; nombre: string; especialidad: string | null };
  paciente: { id: string; nombre: string; dni: string };
  createdBy: { id: string; name: string };
}

const estadoTabs = [
  { key: "", label: "Todas" },
  { key: "pendiente", label: "Pendiente" },
  { key: "validacion_documental", label: "Validacion" },
  { key: "aprobado", label: "Aprobado" },
  { key: "en_preparacion", label: "En Preparacion" },
  { key: "despachado", label: "Despachado" },
  { key: "entregado", label: "Entregado" },
  { key: "cerrado", label: "Cerrado" },
];

const estadoBadgeColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  validacion_documental: "bg-blue-100 text-blue-800",
  aprobado: "bg-green-100 text-green-800",
  en_preparacion: "bg-purple-100 text-purple-800",
  despachado: "bg-orange-100 text-orange-800",
  entregado: "bg-emerald-100 text-emerald-800",
  cerrado: "bg-gray-100 text-gray-800",
  rechazado: "bg-red-100 text-red-800",
};

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  validacion_documental: "Validacion Documental",
  aprobado: "Aprobado",
  en_preparacion: "En Preparacion",
  despachado: "Despachado",
  entregado: "Entregado",
  cerrado: "Cerrado",
  rechazado: "Rechazado",
};

const pagoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
};

const pagoBadgeColors: Record<string, string> = {
  pendiente: "bg-yellow-50 text-yellow-700",
  pagado: "bg-green-50 text-green-700",
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterEstado) params.set("estado", filterEstado);
    fetch(`/api/solicitudes?${params}`)
      .then((res) => res.json())
      .then((data) => setSolicitudes(data.solicitudes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && solicitudes.length === 0) {
    return <LoadingSpinner className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion de solicitudes de productos
          </p>
        </div>
        <Link href="/solicitudes/nueva" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva Solicitud
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por numero, medico, paciente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Estado Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {estadoTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterEstado(tab.key)}
              className={cn(
                "whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                filterEstado === tab.key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Table */}
      {solicitudes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FileText}
            title="No se encontraron solicitudes"
            description={
              filterEstado
                ? "No hay solicitudes con el estado seleccionado."
                : "Crea tu primera solicitud para comenzar."
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>N. Solicitud</th>
                  <th>Medico</th>
                  <th>Paciente</th>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th>Pago</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((sol) => (
                  <tr key={sol.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {sol.numero}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {sol.medico.nombre}
                          </p>
                          {sol.medico.especialidad && (
                            <p className="text-xs text-gray-500">
                              {sol.medico.especialidad}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {sol.paciente.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            DNI: {sol.paciente.dni}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">
                        {sol.nombreProducto || sol.categoriaProducto || "-"}
                      </p>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "badge",
                          estadoBadgeColors[sol.estado] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {estadoLabels[sol.estado] || sol.estado}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "badge",
                          pagoBadgeColors[sol.estadoPago || "pendiente"] ||
                            "bg-gray-50 text-gray-600"
                        )}
                      >
                        {pagoLabels[sol.estadoPago || "pendiente"] ||
                          sol.estadoPago ||
                          "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(sol.createdAt)}
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/solicitudes/${sol.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
