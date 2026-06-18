"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  ClipboardList,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate } from "@/lib/utils";

interface FulfillmentItem {
  id: string;
  solicitudId: string;
  loteAsignado: string | null;
  productoReservado: string | null;
  cantidad: number | null;
  fechaVencimiento: string | null;
  ubicacion: string | null;
  fechaPreparacion: string | null;
  responsableId: string | null;
  fechaDespacho: string | null;
  metodoEnvio: string | null;
  tracking: string | null;
  temperaturaEnvio: string | null;
  estado: string;
  createdAt: string;
  updatedAt: string;
  solicitud: {
    id: string;
    numero: string;
    nombreProducto: string | null;
    categoriaProducto: string | null;
    medico: { id: string; nombre: string };
    paciente: { id: string; nombre: string; dni: string };
  };
  responsable: { id: string; name: string } | null;
}

const estadoTabs = [
  { key: "", label: "Todos" },
  { key: "pendiente", label: "Pendiente" },
  { key: "preparando", label: "Preparando" },
  { key: "listo", label: "Listo" },
  { key: "despachado", label: "Despachado" },
  { key: "entregado", label: "Entregado" },
];

const estadoBadgeColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  preparando: "bg-blue-100 text-blue-800",
  listo: "bg-purple-100 text-purple-800",
  despachado: "bg-orange-100 text-orange-800",
  entregado: "bg-emerald-100 text-emerald-800",
};

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  preparando: "Preparando",
  listo: "Listo",
  despachado: "Despachado",
  entregado: "Entregado",
};

const metodoEnvioLabels: Record<string, string> = {
  moto: "Moto",
  andreani: "Andreani",
  transporte_especializado: "Transporte Especializado",
  retiro: "Retiro en Sede",
};

export default function FulfillmentPage() {
  const [fulfillments, setFulfillments] = useState<FulfillmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [prepararModal, setPrepararModal] = useState<FulfillmentItem | null>(null);
  const [despacharModal, setDespacharModal] = useState<FulfillmentItem | null>(null);

  // Preparar form
  const [prepararForm, setPrepararForm] = useState({
    loteAsignado: "",
    productoReservado: "",
    cantidad: "",
    ubicacion: "",
  });

  // Despachar form
  const [despacharForm, setDespacharForm] = useState({
    metodoEnvio: "",
    tracking: "",
    temperaturaEnvio: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterEstado) params.set("estado", filterEstado);

    fetch(`/api/fulfillment?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setFulfillments(data.fulfillments || []);
      })
      .catch(() => {
        setFulfillments([]);
      })
      .finally(() => setLoading(false));
  }, [filterEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePatch = async (id: string, data: Record<string, unknown>) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/fulfillment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error al actualizar");
      }
      fetchData();
    } catch {
      alert("Error de conexion");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrepararSubmit = () => {
    if (!prepararModal) return;
    handlePatch(prepararModal.id, {
      estado: "preparando",
      loteAsignado: prepararForm.loteAsignado,
      productoReservado: prepararForm.productoReservado,
      cantidad: prepararForm.cantidad ? parseInt(prepararForm.cantidad) : null,
      ubicacion: prepararForm.ubicacion,
    });
    setPrepararModal(null);
    setPrepararForm({ loteAsignado: "", productoReservado: "", cantidad: "", ubicacion: "" });
  };

  const handleDespacharSubmit = () => {
    if (!despacharModal) return;
    handlePatch(despacharModal.id, {
      estado: "despachado",
      metodoEnvio: despacharForm.metodoEnvio,
      tracking: despacharForm.tracking,
      temperaturaEnvio: despacharForm.temperaturaEnvio,
    });
    setDespacharModal(null);
    setDespacharForm({ metodoEnvio: "", tracking: "", temperaturaEnvio: "" });
  };

  const openPrepararModal = (item: FulfillmentItem) => {
    setPrepararForm({ loteAsignado: "", productoReservado: "", cantidad: "", ubicacion: "" });
    setPrepararModal(item);
  };

  const openDespacharModal = (item: FulfillmentItem) => {
    setDespacharForm({ metodoEnvio: "", tracking: "", temperaturaEnvio: "" });
    setDespacharModal(item);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-7 w-7 text-brand-600" />
          Fulfillment / Despacho
        </h1>
        <p className="text-gray-500 mt-1">
          Gestion de preparacion y despacho de productos
        </p>
      </div>

      {/* Filter Tabs */}
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
      {loading ? (
        <LoadingSpinner />
      ) : fulfillments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin registros de fulfillment"
          description="No se encontraron registros para el filtro seleccionado."
        />
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>N° Solicitud</th>
                  <th>Medico</th>
                  <th>Paciente</th>
                  <th>Producto</th>
                  <th>Lote</th>
                  <th>Metodo Envio</th>
                  <th>Tracking</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fulfillments.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono font-semibold">
                      {item.solicitud.numero}
                    </td>
                    <td>{item.solicitud.medico.nombre}</td>
                    <td>{item.solicitud.paciente.nombre}</td>
                    <td>
                      {item.solicitud.nombreProducto ||
                        item.solicitud.categoriaProducto ||
                        "-"}
                    </td>
                    <td>{item.loteAsignado || "-"}</td>
                    <td>
                      {item.metodoEnvio
                        ? metodoEnvioLabels[item.metodoEnvio] || item.metodoEnvio
                        : "-"}
                    </td>
                    <td>{item.tracking || "-"}</td>
                    <td>
                      <span
                        className={cn(
                          "badge",
                          estadoBadgeColors[item.estado] ||
                            "bg-gray-100 text-gray-800"
                        )}
                      >
                        {estadoLabels[item.estado] || item.estado}
                      </span>
                    </td>
                    <td>
                      {item.estado === "pendiente" && (
                        <button
                          onClick={() => openPrepararModal(item)}
                          disabled={actionLoading === item.id}
                          className="text-xs btn-primary px-2 py-1"
                        >
                          Preparar
                        </button>
                      )}
                      {item.estado === "preparando" && (
                        <button
                          onClick={() =>
                            handlePatch(item.id, { estado: "listo" })
                          }
                          disabled={actionLoading === item.id}
                          className="text-xs btn-secondary px-2 py-1"
                        >
                          Marcar Listo
                        </button>
                      )}
                      {item.estado === "listo" && (
                        <button
                          onClick={() => openDespacharModal(item)}
                          disabled={actionLoading === item.id}
                          className="text-xs btn-primary px-2 py-1"
                        >
                          <Truck className="h-3 w-3 inline mr-1" />
                          Despachar
                        </button>
                      )}
                      {item.estado === "despachado" && (
                        <button
                          onClick={() =>
                            handlePatch(item.id, { estado: "entregado" })
                          }
                          disabled={actionLoading === item.id}
                          className="text-xs btn-primary px-2 py-1"
                        >
                          Confirmar Entrega
                        </button>
                      )}
                      {item.estado === "entregado" && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Preparar Pedido */}
      {prepararModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto mt-20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Preparar Pedido
              </h2>
              <button
                onClick={() => setPrepararModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Solicitud:{" "}
              <span className="font-mono font-semibold">
                {prepararModal.solicitud.numero}
              </span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Lote Asignado</label>
                <input
                  type="text"
                  className="input"
                  value={prepararForm.loteAsignado}
                  onChange={(e) =>
                    setPrepararForm({ ...prepararForm, loteAsignado: e.target.value })
                  }
                  placeholder="Ej: LOTE-2026-001"
                />
              </div>
              <div>
                <label className="label">Producto Reservado</label>
                <input
                  type="text"
                  className="input"
                  value={prepararForm.productoReservado}
                  onChange={(e) =>
                    setPrepararForm({ ...prepararForm, productoReservado: e.target.value })
                  }
                  placeholder="Nombre del producto"
                />
              </div>
              <div>
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  className="input"
                  value={prepararForm.cantidad}
                  onChange={(e) =>
                    setPrepararForm({ ...prepararForm, cantidad: e.target.value })
                  }
                  placeholder="Cantidad"
                  min="1"
                />
              </div>
              <div>
                <label className="label">Ubicacion</label>
                <input
                  type="text"
                  className="input"
                  value={prepararForm.ubicacion}
                  onChange={(e) =>
                    setPrepararForm({ ...prepararForm, ubicacion: e.target.value })
                  }
                  placeholder="Ej: Estante A-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPrepararModal(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handlePrepararSubmit} className="btn-primary">
                Confirmar Preparacion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Despachar Pedido */}
      {despacharModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto mt-20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Despachar Pedido
              </h2>
              <button
                onClick={() => setDespacharModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Solicitud:{" "}
              <span className="font-mono font-semibold">
                {despacharModal.solicitud.numero}
              </span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="label">Metodo de Envio</label>
                <select
                  className="select"
                  value={despacharForm.metodoEnvio}
                  onChange={(e) =>
                    setDespacharForm({ ...despacharForm, metodoEnvio: e.target.value })
                  }
                >
                  <option value="">Seleccionar metodo...</option>
                  <option value="moto">Moto</option>
                  <option value="andreani">Andreani</option>
                  <option value="transporte_especializado">
                    Transporte Especializado
                  </option>
                  <option value="retiro">Retiro en Sede</option>
                </select>
              </div>
              <div>
                <label className="label">Numero de Tracking</label>
                <input
                  type="text"
                  className="input"
                  value={despacharForm.tracking}
                  onChange={(e) =>
                    setDespacharForm({ ...despacharForm, tracking: e.target.value })
                  }
                  placeholder="Codigo de seguimiento"
                />
              </div>
              <div>
                <label className="label">Temperatura de Envio</label>
                <input
                  type="text"
                  className="input"
                  value={despacharForm.temperaturaEnvio}
                  onChange={(e) =>
                    setDespacharForm({ ...despacharForm, temperaturaEnvio: e.target.value })
                  }
                  placeholder="Ej: 2-8°C"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDespacharModal(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button onClick={handleDespacharSubmit} className="btn-primary">
                Confirmar Despacho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
