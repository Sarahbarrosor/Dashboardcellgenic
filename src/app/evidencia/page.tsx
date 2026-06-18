"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ClipboardCheck,
  Plus,
  CheckCircle,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDateTime } from "@/lib/utils";

interface Medico {
  id: string;
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  dni: string;
}

interface Solicitud {
  id: string;
  numero: string;
  estado: string;
  medico: Medico;
  paciente: Paciente;
}

interface Evidencia {
  id: string;
  solicitudId: string;
  nombreReceptor: string | null;
  dniReceptor: string | null;
  fechaHoraEntrega: string | null;
  observaciones: string | null;
  estado: string;
  createdAt: string;
  solicitud: Solicitud;
  creadoPor: { id: string; name: string };
}

const estadoTabs = [
  { key: "", label: "Todas" },
  { key: "pendiente", label: "Pendientes" },
  { key: "confirmada", label: "Confirmadas" },
];

const estadoBadgeColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmada: "bg-green-100 text-green-800",
};

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
};

export default function EvidenciaEntregaPage() {
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState<
    Solicitud[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    solicitudId: "",
    nombreReceptor: "",
    dniReceptor: "",
    fechaHoraEntrega: "",
    observaciones: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEstado) params.set("estado", filterEstado);
    fetch(`/api/evidencia?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setEvidencias(data.evidencias || []);
        setSolicitudesDisponibles(data.solicitudesDisponibles || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.solicitudId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/evidencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          solicitudId: "",
          nombreReceptor: "",
          dniReceptor: "",
          fechaHoraEntrega: "",
          observaciones: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error al registrar evidencia:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmar = async (id: string) => {
    try {
      const res = await fetch("/api/evidencia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: "confirmada" }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error al confirmar evidencia:", error);
    }
  };

  if (loading && evidencias.length === 0) {
    return <LoadingSpinner className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Evidencia de Entrega
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Registro y confirmacion de entregas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Registrar Evidencia
        </button>
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
      {evidencias.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardCheck}
            title="No se encontraron evidencias"
            description={
              filterEstado
                ? "No hay evidencias con el estado seleccionado."
                : "Registra tu primera evidencia de entrega para comenzar."
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>N° Solicitud</th>
                  <th>Medico</th>
                  <th>Paciente</th>
                  <th>Receptor</th>
                  <th>DNI Receptor</th>
                  <th>Fecha/Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evidencias.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {ev.solicitud.numero}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-gray-900">
                        {ev.solicitud.medico.nombre}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-gray-900">
                        {ev.solicitud.paciente.nombre}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">
                        {ev.nombreReceptor || "-"}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-gray-900">
                        {ev.dniReceptor || "-"}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-gray-500">
                        {ev.fechaHoraEntrega
                          ? formatDateTime(ev.fechaHoraEntrega)
                          : "-"}
                      </p>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "badge",
                          estadoBadgeColors[ev.estado] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {estadoLabels[ev.estado] || ev.estado}
                      </span>
                    </td>
                    <td>
                      {ev.estado === "pendiente" ? (
                        <button
                          onClick={() => handleConfirmar(ev.id)}
                          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirmar
                        </button>
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto mt-20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Registrar Evidencia de Entrega
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Solicitud</label>
                <select
                  value={form.solicitudId}
                  onChange={(e) =>
                    setForm({ ...form, solicitudId: e.target.value })
                  }
                  className="select"
                  required
                >
                  <option value="">Seleccionar solicitud...</option>
                  {solicitudesDisponibles.map((sol) => (
                    <option key={sol.id} value={sol.id}>
                      N° {sol.numero} - {sol.medico.nombre} -{" "}
                      {sol.paciente.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Nombre del Receptor</label>
                <input
                  type="text"
                  value={form.nombreReceptor}
                  onChange={(e) =>
                    setForm({ ...form, nombreReceptor: e.target.value })
                  }
                  className="input"
                  placeholder="Nombre completo del receptor"
                />
              </div>

              <div>
                <label className="label">DNI del Receptor</label>
                <input
                  type="text"
                  value={form.dniReceptor}
                  onChange={(e) =>
                    setForm({ ...form, dniReceptor: e.target.value })
                  }
                  className="input"
                  placeholder="Numero de documento"
                />
              </div>

              <div>
                <label className="label">Fecha y Hora de Entrega</label>
                <input
                  type="datetime-local"
                  value={form.fechaHoraEntrega}
                  onChange={(e) =>
                    setForm({ ...form, fechaHoraEntrega: e.target.value })
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.solicitudId}
                  className="btn-primary"
                >
                  {submitting ? "Guardando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
