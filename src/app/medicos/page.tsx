"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  X,
  UserRound,
  Eye,
  FileText,
  Stethoscope,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface MedicoRecord {
  id: string;
  nombre: string;
  dni: string;
  matriculaNacional: string | null;
  matriculaProvincial: string | null;
  especialidad: string | null;
  subespecialidad: string | null;
  institucion: string | null;
  cargo: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  miembroSAMHRE: boolean;
  numMiembroSAMHRE: string | null;
  certificadoISSCA: boolean;
  numCertificadoISSCA: string | null;
  workshopCellgenic: boolean;
  fechaWorkshop: string | null;
  otraFormacion: string | null;
  estado: string;
  createdAt: string;
  _count: {
    solicitudes: number;
    pacientes: number;
  };
}

interface MedicosResponse {
  medicos: MedicoRecord[];
}

const estadoBadge: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  validado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
};

const estadoLabel: Record<string, string> = {
  pendiente: "Pendiente",
  validado: "Validado",
  rechazado: "Rechazado",
};

const tabs = [
  { key: "", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "validado", label: "Validados" },
  { key: "rechazado", label: "Rechazados" },
];

const emptyForm = {
  nombre: "",
  dni: "",
  matriculaNacional: "",
  matriculaProvincial: "",
  especialidad: "",
  subespecialidad: "",
  institucion: "",
  cargo: "",
  telefono: "",
  whatsapp: "",
  email: "",
  direccion: "",
  ciudad: "",
  provincia: "",
  codigoPostal: "",
  miembroSAMHRE: false,
  numMiembroSAMHRE: "",
  certificadoISSCA: false,
  numCertificadoISSCA: "",
  workshopCellgenic: false,
  fechaWorkshop: "",
  otraFormacion: "",
};

export default function MedicosPage() {
  const [data, setData] = useState<MedicosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab) params.set("estado", activeTab);
    if (search) params.set("search", search);
    fetch(`/api/medicos?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.nombre || !form.dni || !form.email) return;
    setSubmitting(true);
    try {
      await fetch("/api/medicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Medicos / Clientes
          </h1>
          <p className="text-sm text-gray-500">
            {data?.medicos.length || 0} medicos registrados
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nuevo Medico
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="card card-body">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "bg-brand-100 text-brand-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, email, especialidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {!data?.medicos.length ? (
        <div className="card">
          <EmptyState
            icon={Stethoscope}
            title="No se encontraron medicos"
            description="Registra un nuevo medico para comenzar."
            action={
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> Nuevo Medico
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Nombre
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  DNI
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Especialidad
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Institucion
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Ciudad / Provincia
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Estado
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Solicitudes
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.medicos.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex-shrink-0">
                        {m.nombre
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {m.nombre}
                        </p>
                        <p className="text-xs text-gray-500">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{m.dni}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {m.especialidad || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {m.institucion || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {[m.ciudad, m.provincia].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "badge text-xs",
                        estadoBadge[m.estado] || "bg-gray-100 text-gray-600"
                      )}
                    >
                      {estadoLabel[m.estado] || m.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {m._count.solicitudes}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({m._count.pacientes} pac.)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Documentos"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Nuevo Medico
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Datos personales */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Datos personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="label">Nombre completo *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  className="input"
                  placeholder="Dr. Juan Perez"
                />
              </div>
              <div>
                <label className="label">DNI *</label>
                <input
                  type="text"
                  value={form.dni}
                  onChange={(e) => setField("dni", e.target.value)}
                  className="input"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="input"
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                  className="input"
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  className="input"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            {/* Datos profesionales */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Datos profesionales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="label">Matricula Nacional</label>
                <input
                  type="text"
                  value={form.matriculaNacional}
                  onChange={(e) =>
                    setField("matriculaNacional", e.target.value)
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Matricula Provincial</label>
                <input
                  type="text"
                  value={form.matriculaProvincial}
                  onChange={(e) =>
                    setField("matriculaProvincial", e.target.value)
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Especialidad</label>
                <input
                  type="text"
                  value={form.especialidad}
                  onChange={(e) => setField("especialidad", e.target.value)}
                  className="input"
                  placeholder="Traumatologia"
                />
              </div>
              <div>
                <label className="label">Subespecialidad</label>
                <input
                  type="text"
                  value={form.subespecialidad}
                  onChange={(e) => setField("subespecialidad", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Institucion</label>
                <input
                  type="text"
                  value={form.institucion}
                  onChange={(e) => setField("institucion", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Cargo</label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setField("cargo", e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Ubicacion */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Ubicacion
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="label">Direccion</label>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setField("direccion", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={(e) => setField("ciudad", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Provincia</label>
                <input
                  type="text"
                  value={form.provincia}
                  onChange={(e) => setField("provincia", e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Codigo Postal</label>
                <input
                  type="text"
                  value={form.codigoPostal}
                  onChange={(e) => setField("codigoPostal", e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Certificaciones */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Certificaciones y formacion
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={form.miembroSAMHRE}
                    onChange={(e) =>
                      setField("miembroSAMHRE", e.target.checked)
                    }
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">
                    Miembro SAMHRE
                  </span>
                </label>
                {form.miembroSAMHRE && (
                  <div className="flex-1">
                    <label className="label">Numero de miembro</label>
                    <input
                      type="text"
                      value={form.numMiembroSAMHRE}
                      onChange={(e) =>
                        setField("numMiembroSAMHRE", e.target.value)
                      }
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={form.certificadoISSCA}
                    onChange={(e) =>
                      setField("certificadoISSCA", e.target.checked)
                    }
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">
                    Certificado ISSCA
                  </span>
                </label>
                {form.certificadoISSCA && (
                  <div className="flex-1">
                    <label className="label">Numero de certificado</label>
                    <input
                      type="text"
                      value={form.numCertificadoISSCA}
                      onChange={(e) =>
                        setField("numCertificadoISSCA", e.target.value)
                      }
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-start gap-4">
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={form.workshopCellgenic}
                    onChange={(e) =>
                      setField("workshopCellgenic", e.target.checked)
                    }
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">
                    Workshop Cellgenic
                  </span>
                </label>
                {form.workshopCellgenic && (
                  <div className="flex-1">
                    <label className="label">Fecha del workshop</label>
                    <input
                      type="date"
                      value={form.fechaWorkshop}
                      onChange={(e) =>
                        setField("fechaWorkshop", e.target.value)
                      }
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="label">Otra formacion</label>
                <input
                  type="text"
                  value={form.otraFormacion}
                  onChange={(e) => setField("otraFormacion", e.target.value)}
                  className="input"
                  placeholder="Cursos, diplomaturas, etc."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.nombre || !form.dni || !form.email}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? "Guardando..." : "Crear Medico"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
