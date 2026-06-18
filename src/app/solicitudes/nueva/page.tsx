"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  Send,
  Stethoscope,
  User,
  ClipboardList,
  Package,
  Syringe,
  TestTubes,
  Truck,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

interface MedicoOption {
  id: string;
  nombre: string;
  especialidad: string | null;
}

interface PacienteOption {
  id: string;
  nombre: string;
  dni: string;
}

interface FormData {
  // Step 1: Medico y Paciente
  medicoId: string;
  pacienteId: string;
  // Step 2: Informacion Clinica
  diagnosticoPrincipal: string;
  diagnosticoSecundario: string;
  tiempoEvolucion: string;
  tratamientosPrevios: string;
  objetivoTerapeutico: string[];
  // Step 3: Producto Solicitado
  categoriaProducto: string;
  nombreProducto: string;
  presentacion: string;
  cantidadSolicitada: string;
  numeroViales: string;
  dosisRequerida: string;
  concentracion: string;
  // Step 4: Administracion
  viaAdministracion: string[];
  cantidadAplicar: string;
  numSesiones: string;
  fechaAplicacion: string;
  lugarAplicacion: string;
  // Step 5: Muestra Autologa
  tipoMuestra: string[];
  fechaExtraccion: string;
  horaExtraccion: string;
  lugarExtraccion: string;
  profesionalExtraccion: string;
  metodoTransporte: string;
  temperaturaTransporte: string;
  // Step 6: Entrega
  nombreReceptor: string;
  telefonoReceptor: string;
  institucionEntrega: string;
  direccionEntrega: string;
  ciudadEntrega: string;
  provinciaEntrega: string;
  cpEntrega: string;
  tipoEntrega: string;
  fechaRequerida: string;
  horarioPreferido: string;
}

const initialFormData: FormData = {
  medicoId: "",
  pacienteId: "",
  diagnosticoPrincipal: "",
  diagnosticoSecundario: "",
  tiempoEvolucion: "",
  tratamientosPrevios: "",
  objetivoTerapeutico: [],
  categoriaProducto: "",
  nombreProducto: "",
  presentacion: "",
  cantidadSolicitada: "",
  numeroViales: "",
  dosisRequerida: "",
  concentracion: "",
  viaAdministracion: [],
  cantidadAplicar: "",
  numSesiones: "",
  fechaAplicacion: "",
  lugarAplicacion: "",
  tipoMuestra: [],
  fechaExtraccion: "",
  horaExtraccion: "",
  lugarExtraccion: "",
  profesionalExtraccion: "",
  metodoTransporte: "",
  temperaturaTransporte: "",
  nombreReceptor: "",
  telefonoReceptor: "",
  institucionEntrega: "",
  direccionEntrega: "",
  ciudadEntrega: "",
  provinciaEntrega: "",
  cpEntrega: "",
  tipoEntrega: "",
  fechaRequerida: "",
  horarioPreferido: "",
};

// ── Step config ────────────────────────────────────────────────────

const steps = [
  { key: "medico", label: "Medico y Paciente", icon: Stethoscope },
  { key: "clinica", label: "Informacion Clinica", icon: ClipboardList },
  { key: "producto", label: "Producto Solicitado", icon: Package },
  { key: "administracion", label: "Administracion", icon: Syringe },
  { key: "muestra", label: "Muestra Autologa", icon: TestTubes },
  { key: "entrega", label: "Entrega", icon: Truck },
  { key: "revision", label: "Revision y Envio", icon: FileCheck },
];

const objetivoOptions = [
  "Regeneracion articular",
  "Dolor cronico",
  "Medicina deportiva",
  "Neurologia",
  "Medicina estetica",
  "Antiaging",
  "Alopecia",
  "Disfuncion sexual",
  "Recuperacion postquirurgica",
  "Otro",
];

const categoriaOptions = [
  { value: "exosomas", label: "Exosomas" },
  { value: "celulas_madre", label: "Celulas Madre" },
  { value: "fibroblastos", label: "Fibroblastos" },
  { value: "peptidos", label: "Peptidos" },
  { value: "foliculo_piloso", label: "Foliculo Piloso" },
  { value: "lisado_plaquetario", label: "Lisado Plaquetario" },
  { value: "otro", label: "Otro" },
];

const viaOptions = [
  "Intravenosa",
  "Intraarticular",
  "Intradermica",
  "Intramuscular",
  "Intratecal",
  "Topica",
  "Otra",
];

const tipoMuestraOptions = [
  "Tejido adiposo",
  "Foliculo piloso",
  "Sangre periferica",
  "Medula osea",
  "Otro",
];

const tipoEntregaOptions = [
  { value: "cadena_frio", label: "Cadena de frio" },
  { value: "temperatura_ambiente", label: "Temperatura ambiente" },
  { value: "retiro_laboratorio", label: "Retiro en laboratorio" },
];

// ── Component ──────────────────────────────────────────────────────

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [medicos, setMedicos] = useState<MedicoOption[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [loadingMedicos, setLoadingMedicos] = useState(true);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch medicos on mount
  useEffect(() => {
    fetch("/api/medicos")
      .then((res) => res.json())
      .then((data) => setMedicos(data.medicos || []))
      .catch(console.error)
      .finally(() => setLoadingMedicos(false));
  }, []);

  // Fetch pacientes when medico changes
  useEffect(() => {
    if (!formData.medicoId) {
      setPacientes([]);
      return;
    }
    setLoadingPacientes(true);
    fetch(`/api/pacientes?medicoId=${formData.medicoId}`)
      .then((res) => res.json())
      .then((data) => setPacientes(data.pacientes || []))
      .catch(console.error)
      .finally(() => setLoadingPacientes(false));
  }, [formData.medicoId]);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCheckbox = (field: "objetivoTerapeutico" | "viaAdministracion" | "tipoMuestra", value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const canProceed = (): boolean => {
    if (currentStep === 0) {
      return !!formData.medicoId && !!formData.pacienteId;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...formData,
        objetivoTerapeutico: formData.objetivoTerapeutico.join(", "),
        viaAdministracion: formData.viaAdministracion.join(", "),
        tipoMuestra: formData.tipoMuestra.join(", "),
        cantidadSolicitada: formData.cantidadSolicitada
          ? parseInt(formData.cantidadSolicitada)
          : null,
        numeroViales: formData.numeroViales
          ? parseInt(formData.numeroViales)
          : null,
        numSesiones: formData.numSesiones
          ? parseInt(formData.numSesiones)
          : null,
      };

      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la solicitud");
      }

      router.push("/solicitudes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────

  const selectedMedico = medicos.find((m) => m.id === formData.medicoId);
  const selectedPaciente = pacientes.find((p) => p.id === formData.pacienteId);

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/solicitudes"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nueva Solicitud
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete el formulario para crear una nueva solicitud de producto
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="card card-body">
        <nav className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <button
                key={step.key}
                onClick={() => {
                  if (index < currentStep || (index === currentStep + 1 && canProceed())) {
                    setCurrentStep(index);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 flex-1 group relative",
                  index <= currentStep
                    ? "cursor-pointer"
                    : "cursor-default"
                )}
              >
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-4 right-1/2 w-full h-0.5 -z-10",
                      index <= currentStep ? "bg-brand-500" : "bg-gray-200"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all",
                    isActive
                      ? "border-brand-500 bg-brand-500 text-white"
                      : isCompleted
                      ? "border-brand-500 bg-brand-50 text-brand-600"
                      : "border-gray-300 bg-white text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium text-center leading-tight hidden sm:block",
                    isActive
                      ? "text-brand-600"
                      : isCompleted
                      ? "text-brand-500"
                      : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form Card */}
      <div className="card card-body">
        {/* Step Title */}
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {steps[currentStep].label}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {currentStep === 0 && "Seleccione el medico y paciente para esta solicitud"}
            {currentStep === 1 && "Ingrese la informacion clinica del paciente"}
            {currentStep === 2 && "Especifique el producto solicitado"}
            {currentStep === 3 && "Indique los detalles de administracion"}
            {currentStep === 4 && "Complete si se requiere muestra autologa (opcional)"}
            {currentStep === 5 && "Datos de entrega del producto"}
            {currentStep === 6 && "Revise los datos y envie la solicitud"}
          </p>
        </div>

        {/* Step 1: Medico y Paciente */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <label className="label">
                <Stethoscope className="h-4 w-4 inline mr-1.5" />
                Medico
              </label>
              {loadingMedicos ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando medicos...
                </div>
              ) : (
                <select
                  value={formData.medicoId}
                  onChange={(e) => {
                    updateField("medicoId", e.target.value);
                    updateField("pacienteId", "");
                  }}
                  className="select"
                >
                  <option value="">Seleccionar medico...</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                      {m.especialidad ? ` - ${m.especialidad}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {medicos.length === 0 && !loadingMedicos && (
                <p className="text-xs text-gray-500 mt-1">
                  No hay medicos registrados.{" "}
                  <Link href="/medicos" className="text-brand-600 hover:underline">
                    Registrar medico
                  </Link>
                </p>
              )}
            </div>

            {formData.medicoId && (
              <div>
                <label className="label">
                  <User className="h-4 w-4 inline mr-1.5" />
                  Paciente
                </label>
                {loadingPacientes ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando pacientes...
                  </div>
                ) : (
                  <select
                    value={formData.pacienteId}
                    onChange={(e) => updateField("pacienteId", e.target.value)}
                    className="select"
                  >
                    <option value="">Seleccionar paciente...</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - DNI: {p.dni}
                      </option>
                    ))}
                  </select>
                )}
                {pacientes.length === 0 && !loadingPacientes && (
                  <p className="text-xs text-gray-500 mt-1">
                    Este medico no tiene pacientes registrados.{" "}
                    <Link href="/pacientes" className="text-brand-600 hover:underline">
                      Registrar paciente
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Informacion Clinica */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="label">Diagnostico Principal</label>
              <textarea
                value={formData.diagnosticoPrincipal}
                onChange={(e) =>
                  updateField("diagnosticoPrincipal", e.target.value)
                }
                className="input"
                rows={3}
                placeholder="Ingrese el diagnostico principal del paciente..."
              />
            </div>
            <div>
              <label className="label">Diagnostico Secundario</label>
              <textarea
                value={formData.diagnosticoSecundario}
                onChange={(e) =>
                  updateField("diagnosticoSecundario", e.target.value)
                }
                className="input"
                rows={2}
                placeholder="Diagnostico secundario (si aplica)..."
              />
            </div>
            <div>
              <label className="label">Tiempo de Evolucion</label>
              <input
                type="text"
                value={formData.tiempoEvolucion}
                onChange={(e) =>
                  updateField("tiempoEvolucion", e.target.value)
                }
                className="input"
                placeholder="Ej: 6 meses, 2 anos..."
              />
            </div>
            <div>
              <label className="label">Tratamientos Previos</label>
              <textarea
                value={formData.tratamientosPrevios}
                onChange={(e) =>
                  updateField("tratamientosPrevios", e.target.value)
                }
                className="input"
                rows={3}
                placeholder="Describa los tratamientos previos realizados..."
              />
            </div>
            <div>
              <label className="label">Objetivo Terapeutico</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {objetivoOptions.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all",
                      formData.objetivoTerapeutico.includes(opt)
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.objetivoTerapeutico.includes(opt)}
                      onChange={() =>
                        toggleCheckbox("objetivoTerapeutico", opt)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Producto Solicitado */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="label">Categoria del Producto</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {categoriaOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center",
                      formData.categoriaProducto === opt.value
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="categoriaProducto"
                      value={opt.value}
                      checked={formData.categoriaProducto === opt.value}
                      onChange={(e) =>
                        updateField("categoriaProducto", e.target.value)
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del Producto</label>
                <input
                  type="text"
                  value={formData.nombreProducto}
                  onChange={(e) =>
                    updateField("nombreProducto", e.target.value)
                  }
                  className="input"
                  placeholder="Nombre especifico del producto..."
                />
              </div>
              <div>
                <label className="label">Presentacion</label>
                <input
                  type="text"
                  value={formData.presentacion}
                  onChange={(e) =>
                    updateField("presentacion", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: Vial 5ml, Jeringa precargada..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label">Cantidad Solicitada</label>
                <input
                  type="number"
                  min="1"
                  value={formData.cantidadSolicitada}
                  onChange={(e) =>
                    updateField("cantidadSolicitada", e.target.value)
                  }
                  className="input"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="label">Numero de Viales</label>
                <input
                  type="number"
                  min="1"
                  value={formData.numeroViales}
                  onChange={(e) =>
                    updateField("numeroViales", e.target.value)
                  }
                  className="input"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="label">Dosis Requerida</label>
                <input
                  type="text"
                  value={formData.dosisRequerida}
                  onChange={(e) =>
                    updateField("dosisRequerida", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: 10M celulas"
                />
              </div>
              <div>
                <label className="label">Concentracion</label>
                <input
                  type="text"
                  value={formData.concentracion}
                  onChange={(e) =>
                    updateField("concentracion", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: 2M/ml"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Administracion */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <label className="label">Via de Administracion</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {viaOptions.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all",
                      formData.viaAdministracion.includes(opt)
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.viaAdministracion.includes(opt)}
                      onChange={() =>
                        toggleCheckbox("viaAdministracion", opt)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Cantidad a Aplicar</label>
                <input
                  type="text"
                  value={formData.cantidadAplicar}
                  onChange={(e) =>
                    updateField("cantidadAplicar", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: 5ml por sesion..."
                />
              </div>
              <div>
                <label className="label">Numero de Sesiones</label>
                <input
                  type="number"
                  min="1"
                  value={formData.numSesiones}
                  onChange={(e) =>
                    updateField("numSesiones", e.target.value)
                  }
                  className="input"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha de Aplicacion</label>
                <input
                  type="date"
                  value={formData.fechaAplicacion}
                  onChange={(e) =>
                    updateField("fechaAplicacion", e.target.value)
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Lugar de Aplicacion</label>
                <input
                  type="text"
                  value={formData.lugarAplicacion}
                  onChange={(e) =>
                    updateField("lugarAplicacion", e.target.value)
                  }
                  className="input"
                  placeholder="Institucion o consultorio..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Muestra Autologa */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                Esta seccion es opcional. Complete solo si el tratamiento
                requiere una muestra autologa del paciente.
              </p>
            </div>
            <div>
              <label className="label">Tipo de Muestra</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {tipoMuestraOptions.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-all",
                      formData.tipoMuestra.includes(opt)
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tipoMuestra.includes(opt)}
                      onChange={() => toggleCheckbox("tipoMuestra", opt)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha de Extraccion</label>
                <input
                  type="date"
                  value={formData.fechaExtraccion}
                  onChange={(e) =>
                    updateField("fechaExtraccion", e.target.value)
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Hora de Extraccion</label>
                <input
                  type="time"
                  value={formData.horaExtraccion}
                  onChange={(e) =>
                    updateField("horaExtraccion", e.target.value)
                  }
                  className="input"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Lugar de Extraccion</label>
                <input
                  type="text"
                  value={formData.lugarExtraccion}
                  onChange={(e) =>
                    updateField("lugarExtraccion", e.target.value)
                  }
                  className="input"
                  placeholder="Centro medico o laboratorio..."
                />
              </div>
              <div>
                <label className="label">Profesional que Realiza la Extraccion</label>
                <input
                  type="text"
                  value={formData.profesionalExtraccion}
                  onChange={(e) =>
                    updateField("profesionalExtraccion", e.target.value)
                  }
                  className="input"
                  placeholder="Nombre del profesional..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Metodo de Transporte</label>
                <input
                  type="text"
                  value={formData.metodoTransporte}
                  onChange={(e) =>
                    updateField("metodoTransporte", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: Cadena de frio, contenedor termico..."
                />
              </div>
              <div>
                <label className="label">Temperatura de Transporte</label>
                <input
                  type="text"
                  value={formData.temperaturaTransporte}
                  onChange={(e) =>
                    updateField("temperaturaTransporte", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: 2-8 C..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Entrega */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre del Receptor</label>
                <input
                  type="text"
                  value={formData.nombreReceptor}
                  onChange={(e) =>
                    updateField("nombreReceptor", e.target.value)
                  }
                  className="input"
                  placeholder="Persona que recibira el producto..."
                />
              </div>
              <div>
                <label className="label">Telefono del Receptor</label>
                <input
                  type="tel"
                  value={formData.telefonoReceptor}
                  onChange={(e) =>
                    updateField("telefonoReceptor", e.target.value)
                  }
                  className="input"
                  placeholder="+54 11 ..."
                />
              </div>
            </div>
            <div>
              <label className="label">Institucion de Entrega</label>
              <input
                type="text"
                value={formData.institucionEntrega}
                onChange={(e) =>
                  updateField("institucionEntrega", e.target.value)
                }
                className="input"
                placeholder="Hospital, clinica o consultorio..."
              />
            </div>
            <div>
              <label className="label">Direccion de Entrega</label>
              <input
                type="text"
                value={formData.direccionEntrega}
                onChange={(e) =>
                  updateField("direccionEntrega", e.target.value)
                }
                className="input"
                placeholder="Calle, numero, piso, departamento..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Ciudad</label>
                <input
                  type="text"
                  value={formData.ciudadEntrega}
                  onChange={(e) =>
                    updateField("ciudadEntrega", e.target.value)
                  }
                  className="input"
                  placeholder="Ciudad..."
                />
              </div>
              <div>
                <label className="label">Provincia</label>
                <input
                  type="text"
                  value={formData.provinciaEntrega}
                  onChange={(e) =>
                    updateField("provinciaEntrega", e.target.value)
                  }
                  className="input"
                  placeholder="Provincia..."
                />
              </div>
              <div>
                <label className="label">Codigo Postal</label>
                <input
                  type="text"
                  value={formData.cpEntrega}
                  onChange={(e) => updateField("cpEntrega", e.target.value)}
                  className="input"
                  placeholder="C.P."
                />
              </div>
            </div>
            <div>
              <label className="label">Tipo de Entrega</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {tipoEntregaOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all text-center",
                      formData.tipoEntrega === opt.value
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="tipoEntrega"
                      value={opt.value}
                      checked={formData.tipoEntrega === opt.value}
                      onChange={(e) =>
                        updateField("tipoEntrega", e.target.value)
                      }
                      className="sr-only"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Fecha Requerida de Entrega</label>
                <input
                  type="date"
                  value={formData.fechaRequerida}
                  onChange={(e) =>
                    updateField("fechaRequerida", e.target.value)
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="label">Horario Preferido</label>
                <input
                  type="text"
                  value={formData.horarioPreferido}
                  onChange={(e) =>
                    updateField("horarioPreferido", e.target.value)
                  }
                  className="input"
                  placeholder="Ej: 9:00 - 12:00..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Revision y Envio */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {/* Medico y Paciente */}
            <SummarySection title="Medico y Paciente">
              <SummaryRow label="Medico" value={selectedMedico?.nombre} />
              <SummaryRow
                label="Especialidad"
                value={selectedMedico?.especialidad}
              />
              <SummaryRow label="Paciente" value={selectedPaciente?.nombre} />
              <SummaryRow label="DNI Paciente" value={selectedPaciente?.dni} />
            </SummarySection>

            {/* Informacion Clinica */}
            <SummarySection title="Informacion Clinica">
              <SummaryRow
                label="Diagnostico Principal"
                value={formData.diagnosticoPrincipal}
              />
              <SummaryRow
                label="Diagnostico Secundario"
                value={formData.diagnosticoSecundario}
              />
              <SummaryRow
                label="Tiempo de Evolucion"
                value={formData.tiempoEvolucion}
              />
              <SummaryRow
                label="Tratamientos Previos"
                value={formData.tratamientosPrevios}
              />
              <SummaryRow
                label="Objetivo Terapeutico"
                value={formData.objetivoTerapeutico.join(", ")}
              />
            </SummarySection>

            {/* Producto */}
            <SummarySection title="Producto Solicitado">
              <SummaryRow
                label="Categoria"
                value={
                  categoriaOptions.find(
                    (c) => c.value === formData.categoriaProducto
                  )?.label
                }
              />
              <SummaryRow label="Producto" value={formData.nombreProducto} />
              <SummaryRow
                label="Presentacion"
                value={formData.presentacion}
              />
              <SummaryRow
                label="Cantidad"
                value={formData.cantidadSolicitada}
              />
              <SummaryRow label="Viales" value={formData.numeroViales} />
              <SummaryRow label="Dosis" value={formData.dosisRequerida} />
              <SummaryRow
                label="Concentracion"
                value={formData.concentracion}
              />
            </SummarySection>

            {/* Administracion */}
            <SummarySection title="Administracion">
              <SummaryRow
                label="Via"
                value={formData.viaAdministracion.join(", ")}
              />
              <SummaryRow
                label="Cantidad a Aplicar"
                value={formData.cantidadAplicar}
              />
              <SummaryRow label="Sesiones" value={formData.numSesiones} />
              <SummaryRow
                label="Fecha de Aplicacion"
                value={formData.fechaAplicacion}
              />
              <SummaryRow
                label="Lugar de Aplicacion"
                value={formData.lugarAplicacion}
              />
            </SummarySection>

            {/* Muestra Autologa */}
            {formData.tipoMuestra.length > 0 && (
              <SummarySection title="Muestra Autologa">
                <SummaryRow
                  label="Tipo"
                  value={formData.tipoMuestra.join(", ")}
                />
                <SummaryRow
                  label="Fecha de Extraccion"
                  value={formData.fechaExtraccion}
                />
                <SummaryRow
                  label="Hora"
                  value={formData.horaExtraccion}
                />
                <SummaryRow
                  label="Lugar"
                  value={formData.lugarExtraccion}
                />
                <SummaryRow
                  label="Profesional"
                  value={formData.profesionalExtraccion}
                />
                <SummaryRow
                  label="Transporte"
                  value={formData.metodoTransporte}
                />
                <SummaryRow
                  label="Temperatura"
                  value={formData.temperaturaTransporte}
                />
              </SummarySection>
            )}

            {/* Entrega */}
            <SummarySection title="Entrega">
              <SummaryRow label="Receptor" value={formData.nombreReceptor} />
              <SummaryRow
                label="Telefono"
                value={formData.telefonoReceptor}
              />
              <SummaryRow
                label="Institucion"
                value={formData.institucionEntrega}
              />
              <SummaryRow
                label="Direccion"
                value={formData.direccionEntrega}
              />
              <SummaryRow
                label="Ciudad / Provincia / CP"
                value={
                  [
                    formData.ciudadEntrega,
                    formData.provinciaEntrega,
                    formData.cpEntrega,
                  ]
                    .filter(Boolean)
                    .join(", ") || undefined
                }
              />
              <SummaryRow
                label="Tipo de Entrega"
                value={
                  tipoEntregaOptions.find(
                    (t) => t.value === formData.tipoEntrega
                  )?.label
                }
              />
              <SummaryRow
                label="Fecha Requerida"
                value={formData.fechaRequerida}
              />
              <SummaryRow
                label="Horario"
                value={formData.horarioPreferido}
              />
            </SummarySection>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
              currentStep === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                canProceed()
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Solicitud
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary Helpers ──────────────────────────────────────────────

function SummarySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-2">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <span className="text-sm text-gray-500 w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
