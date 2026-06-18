"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  Receipt,
  Calendar,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";

interface Pago {
  id: string;
  solicitudNum: string;
  monto: number;
  metodo: string;
  comprobante: string | null;
  estado: string;
  fechaPago: string | null;
  createdAt: string;
}

interface PagoStats {
  totalCobrado: number;
  pendientes: number;
  confirmados: number;
}

const estadoTabs = [
  { key: "", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "confirmado", label: "Confirmados" },
];

const estadoBadgeColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  confirmado: "bg-green-100 text-green-800",
};

const metodoLabels: Record<string, string> = {
  quickbooks: "QuickBooks",
  efectivo: "Efectivo",
  transferencia: "Transferencia",
};

const formatARS = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [stats, setStats] = useState<PagoStats>({
    totalCobrado: 0,
    pendientes: 0,
    confirmados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    solicitudNum: "",
    monto: "",
    metodo: "transferencia",
    comprobante: "",
    fechaPago: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEstado) params.set("estado", filterEstado);
    fetch(`/api/pagos?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPagos(data.pagos || []);
        setStats(
          data.stats || { totalCobrado: 0, pendientes: 0, confirmados: 0 }
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          solicitudNum: "",
          monto: "",
          metodo: "transferencia",
          comprobante: "",
          fechaPago: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error al registrar pago:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && pagos.length === 0) {
    return <LoadingSpinner className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Pagos / Facturacion
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion de pagos y facturacion
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Registrar Pago
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cobrado (Mes)</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatARS(stats.totalCobrado)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes de Cobro</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.pendientes}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagos Confirmados</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.confirmados}
                </p>
              </div>
            </div>
          </div>
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
      {pagos.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Receipt}
            title="No se encontraron pagos"
            description={
              filterEstado
                ? "No hay pagos con el estado seleccionado."
                : "Registra tu primer pago para comenzar."
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
                  <th>Monto</th>
                  <th>Metodo</th>
                  <th>Comprobante</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {pago.solicitudNum}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-900">
                        {formatARS(pago.monto)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-900">
                        {metodoLabels[pago.metodo] || pago.metodo}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {pago.comprobante || "-"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={cn(
                          "badge",
                          estadoBadgeColors[pago.estado] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {pago.estado === "confirmado"
                          ? "Confirmado"
                          : "Pendiente"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {pago.fechaPago
                          ? formatDate(pago.fechaPago)
                          : formatDate(pago.createdAt)}
                      </div>
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto mt-20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Registrar Pago
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
                <label className="label">N. Solicitud</label>
                <input
                  type="text"
                  value={formData.solicitudNum}
                  onChange={(e) =>
                    setFormData({ ...formData, solicitudNum: e.target.value })
                  }
                  className="input"
                  placeholder="SOL-2026-00001"
                  required
                />
              </div>

              <div>
                <label className="label">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) =>
                    setFormData({ ...formData, monto: e.target.value })
                  }
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="label">Metodo de Pago</label>
                <select
                  value={formData.metodo}
                  onChange={(e) =>
                    setFormData({ ...formData, metodo: e.target.value })
                  }
                  className="select"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="quickbooks">QuickBooks</option>
                </select>
              </div>

              <div>
                <label className="label">Comprobante</label>
                <input
                  type="text"
                  value={formData.comprobante}
                  onChange={(e) =>
                    setFormData({ ...formData, comprobante: e.target.value })
                  }
                  className="input"
                  placeholder="Numero de comprobante (opcional)"
                />
              </div>

              <div>
                <label className="label">Fecha de Pago</label>
                <input
                  type="date"
                  value={formData.fechaPago}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaPago: e.target.value })
                  }
                  className="input"
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
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Guardando..." : "Registrar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
