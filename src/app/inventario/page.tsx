"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  X,
  Snowflake,
  Sun,
  Calendar,
  Boxes,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";

interface ProductoRef {
  id: string;
  nombre: string;
  sku: string;
  categoria: string;
  presentacion: string | null;
  precioUnitario: number;
  costoUnitario: number;
  requiereFrio: boolean;
}

interface InventarioItem {
  id: string;
  productoId: string;
  lote: string;
  cantidad: number;
  fechaVencimiento: string | null;
  ubicacion: string;
  tipoAlmacenamiento: string;
  umbralMinimo: number;
  createdAt: string;
  updatedAt: string;
  producto: ProductoRef;
  estado: string;
  proximoAVencer: boolean;
}

interface Resumen {
  totalProductos: number;
  stockTotal: number;
  stockBajo: number;
  vencimientosProximos: number;
}

interface InventarioResponse {
  items: InventarioItem[];
  resumen: Resumen;
}

const CATEGORIAS = [
  { value: "todos", label: "Todos" },
  { value: "exosomas", label: "Exosomas" },
  { value: "celulas_madre", label: "Células Madre" },
  { value: "fibroblastos", label: "Fibroblastos" },
  { value: "peptidos", label: "Péptidos" },
  { value: "foliculo_piloso", label: "Folículo Piloso" },
  { value: "lisado_plaquetario", label: "Lisado Plaquetario" },
  { value: "otro", label: "Otro" },
];

const ALMACENAMIENTO = [
  { value: "todos", label: "Todos" },
  { value: "frio", label: "Frío" },
  { value: "seco", label: "Seco" },
];

const estadoConfig: Record<string, { label: string; className: string }> = {
  ok: { label: "OK", className: "bg-green-100 text-green-700" },
  bajo: { label: "Bajo", className: "bg-yellow-100 text-yellow-700" },
  critico: { label: "Crítico", className: "bg-red-100 text-red-700" },
  agotado: { label: "Agotado", className: "bg-gray-100 text-gray-700" },
};

const categoriaLabels: Record<string, string> = {
  exosomas: "Exosomas",
  celulas_madre: "Células Madre",
  fibroblastos: "Fibroblastos",
  peptidos: "Péptidos",
  foliculo_piloso: "Folículo Piloso",
  lisado_plaquetario: "Lisado Plaquetario",
  otro: "Otro",
};

function formatFecha(date: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function InventarioPage() {
  const [data, setData] = useState<InventarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("todos");
  const [filterAlmacenamiento, setFilterAlmacenamiento] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [productos, setProductos] = useState<ProductoRef[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productoId: "",
    lote: "",
    cantidad: 0,
    fechaVencimiento: "",
    ubicacion: "",
    tipoAlmacenamiento: "frio",
    umbralMinimo: 5,
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCategoria !== "todos") params.set("categoria", filterCategoria);
    if (filterAlmacenamiento !== "todos")
      params.set("almacenamiento", filterAlmacenamiento);

    fetch(`/api/inventario?${params}`)
      .then((res) => res.json())
      .then((d) => {
        if (d && Array.isArray(d.items)) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterCategoria, filterAlmacenamiento]);

  const fetchProductos = useCallback(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d?.productos)) setProductos(d.productos);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = () => {
    fetchProductos();
    setFormData({
      productoId: "",
      lote: "",
      cantidad: 0,
      fechaVencimiento: "",
      ubicacion: "",
      tipoAlmacenamiento: "frio",
      umbralMinimo: 5,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cantidad: Number(formData.cantidad),
          umbralMinimo: Number(formData.umbralMinimo),
          fechaVencimiento: formData.fechaVencimiento || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Error al agregar stock");
        setSubmitting(false);
        return;
      }

      setShowModal(false);
      fetchData();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
        <button onClick={openModal} className="btn-primary">
          <Plus className="h-4 w-4" />
          Agregar Stock
        </button>
      </div>

      {/* Summary Cards */}
      {data?.resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            title="Total Productos"
            value={data.resumen.totalProductos.toString()}
            icon={Package}
            iconColor="bg-blue-100 text-blue-600"
          />
          <MetricCard
            title="Stock Total"
            value={`${data.resumen.stockTotal} uds`}
            icon={Boxes}
            iconColor="bg-green-100 text-green-600"
          />
          <MetricCard
            title="Stock Bajo"
            value={data.resumen.stockBajo.toString()}
            icon={AlertTriangle}
            iconColor="bg-yellow-100 text-yellow-600"
          />
          <MetricCard
            title="Vencimientos Próximos"
            value={data.resumen.vencimientosProximos.toString()}
            icon={Calendar}
            iconColor="bg-red-100 text-red-600"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="select w-auto"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterAlmacenamiento}
            onChange={(e) => setFilterAlmacenamiento(e.target.value)}
            className="select w-auto"
          >
            {ALMACENAMIENTO.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {!data?.items.length ? (
          <EmptyState
            icon={Package}
            title="Sin registros de inventario"
            description="Agregá stock usando el botón de arriba para comenzar a gestionar el inventario."
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Lote</th>
                  <th>Cantidad</th>
                  <th>Almacenamiento</th>
                  <th>Vencimiento</th>
                  <th>Ubicación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const cfg = estadoConfig[item.estado] || estadoConfig.ok;
                  const vencido =
                    item.fechaVencimiento &&
                    new Date(item.fechaVencimiento) < new Date();
                  return (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.producto.nombre}
                          </span>
                          <br />
                          <span className="text-xs text-gray-400 font-mono">
                            {item.producto.sku}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-gray-100 text-gray-700">
                          {categoriaLabels[item.producto.categoria] ||
                            item.producto.categoria}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{item.lote}</td>
                      <td>
                        <span
                          className={cn(
                            "font-semibold",
                            item.estado === "critico" && "text-red-600",
                            item.estado === "bajo" && "text-yellow-600",
                            item.estado === "agotado" && "text-gray-400"
                          )}
                        >
                          {item.cantidad}
                        </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {item.tipoAlmacenamiento === "frio" ? (
                            <>
                              <Snowflake className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-700">Frío</span>
                            </>
                          ) : (
                            <>
                              <Sun className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-700">Seco</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            vencido && "text-red-600 font-semibold",
                            item.proximoAVencer &&
                              !vencido &&
                              "text-orange-600 font-medium"
                          )}
                        >
                          {formatFecha(item.fechaVencimiento)}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {item.ubicacion}
                      </td>
                      <td>
                        <span className={cn("badge", cfg.className)}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Agregar Stock */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                Agregar Stock
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {formError}
                </div>
              )}

              {/* Producto */}
              <div>
                <label className="label">Producto</label>
                <select
                  value={formData.productoId}
                  onChange={(e) =>
                    setFormData({ ...formData, productoId: e.target.value })
                  }
                  className="select"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lote */}
              <div>
                <label className="label">Lote</label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) =>
                    setFormData({ ...formData, lote: e.target.value })
                  }
                  className="input"
                  placeholder="Ej: LOTE-2026-001"
                  required
                />
              </div>

              {/* Cantidad + Umbral Mínimo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cantidad}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidad: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Umbral Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.umbralMinimo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        umbralMinimo: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* Fecha Vencimiento */}
              <div>
                <label className="label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fechaVencimiento: e.target.value,
                    })
                  }
                  className="input"
                />
              </div>

              {/* Ubicación */}
              <div>
                <label className="label">Ubicación</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  className="input"
                  placeholder="Ej: Laboratorio Principal"
                />
              </div>

              {/* Tipo Almacenamiento */}
              <div>
                <label className="label">Tipo de Almacenamiento</label>
                <select
                  value={formData.tipoAlmacenamiento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipoAlmacenamiento: e.target.value,
                    })
                  }
                  className="select"
                >
                  <option value="frio">Frío</option>
                  <option value="seco">Seco</option>
                </select>
              </div>

              {/* Submit */}
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
                  {submitting ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
