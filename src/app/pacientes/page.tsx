"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, Plus, X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

interface Medico {
  id: string;
  nombre: string;
}

interface Paciente {
  id: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  peso: string | null;
  altura: string | null;
  telefono: string | null;
  email: string | null;
  medicoId: string;
  createdAt: string;
  medico: { id: string; nombre: string };
  _count: { solicitudes: number };
}

interface PacientesResponse {
  pacientes: Paciente[];
}

const initialForm = {
  nombre: "",
  dni: "",
  fechaNacimiento: "",
  edad: "",
  sexo: "",
  peso: "",
  altura: "",
  telefono: "",
  email: "",
  medicoId: "",
};

export default function PacientesPage() {
  const [data, setData] = useState<PacientesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/pacientes?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  const fetchMedicos = useCallback(() => {
    fetch("/api/medicos")
      .then((res) => res.json())
      .then((res) => setMedicos(res.medicos || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (showNewForm) fetchMedicos();
  }, [showNewForm, fetchMedicos]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createPaciente = async () => {
    if (!form.nombre || !form.dni || !form.medicoId) {
      setError("Nombre, DNI y Médico Tratante son obligatorios.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear el paciente.");
        return;
      }
      setShowNewForm(false);
      setForm(initialForm);
      fetchData();
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI, email o telefono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
          />
        </div>
        <button
          onClick={() => {
            setShowNewForm(true);
            setError("");
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Nuevo Paciente
        </button>
      </div>

      {/* New Patient Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card card-body w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Nuevo Paciente
              </h3>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setForm(initialForm);
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="input"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="label">DNI *</label>
                <input
                  type="text"
                  name="dni"
                  value={form.dni}
                  onChange={handleChange}
                  className="input"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="label">Fecha de Nacimiento</label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={form.fechaNacimiento}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Edad</label>
                <input
                  type="number"
                  name="edad"
                  value={form.edad}
                  onChange={handleChange}
                  className="input"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="label">Sexo</label>
                <select
                  name="sexo"
                  value={form.sexo}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="">Seleccionar...</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
              <div>
                <label className="label">Peso (kg)</label>
                <input
                  type="text"
                  name="peso"
                  value={form.peso}
                  onChange={handleChange}
                  className="input"
                  placeholder="75"
                />
              </div>
              <div>
                <label className="label">Altura (cm)</label>
                <input
                  type="text"
                  name="altura"
                  value={form.altura}
                  onChange={handleChange}
                  className="input"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="label">Telefono</label>
                <input
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="input"
                  placeholder="+54 11 1234-5678"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="paciente@email.com"
                />
              </div>
              <div>
                <label className="label">Medico Tratante *</label>
                <select
                  name="medicoId"
                  value={form.medicoId}
                  onChange={handleChange}
                  className="select"
                >
                  <option value="">Seleccionar medico...</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setForm(initialForm);
                  setError("");
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={createPaciente}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? "Guardando..." : "Crear Paciente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patients Table */}
      {!data?.pacientes.length ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No se encontraron pacientes"
            description="Registre un nuevo paciente para comenzar."
          />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Edad</th>
                  <th>Sexo</th>
                  <th>Medico Tratante</th>
                  <th>Telefono</th>
                  <th>Solicitudes</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {data.pacientes.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.nombre}</td>
                    <td className="text-gray-500 font-mono text-xs">
                      {p.dni}
                    </td>
                    <td>{p.edad ?? "-"}</td>
                    <td>
                      {p.sexo ? (
                        <span className="badge bg-gray-100 text-gray-600">
                          {p.sexo === "masculino" ? "Masculino" : "Femenino"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{p.medico.nombre}</td>
                    <td className="text-gray-500 text-xs">
                      {p.telefono || "-"}
                    </td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-700">
                        {p._count.solicitudes}
                      </span>
                    </td>
                    <td className="text-gray-500 text-xs">
                      {formatDateTime(p.createdAt)}
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
