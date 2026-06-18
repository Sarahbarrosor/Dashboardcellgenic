export interface DashboardMetrics {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesEnProceso: number;
  solicitudesEntregadas: number;
  medicosValidados: number;
  pagosPendientes: number;
  solicitudesPorEstado: { estado: string; count: number }[];
  solicitudesRecientes: SolicitudResumen[];
  alertasRecientes: AlertData[];
}

export interface SolicitudResumen {
  id: string;
  numero: string;
  estado: string;
  medicoNombre: string;
  pacienteNombre: string;
  producto: string;
  fecha: string;
  monto: number | null;
}

export interface AlertData {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface MedicoDetalle {
  id: string;
  nombre: string;
  dni: string;
  matriculaNacional: string | null;
  matriculaProvincial: string | null;
  especialidad: string | null;
  institucion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  email: string;
  ciudad: string | null;
  provincia: string | null;
  miembroSAMHRE: boolean;
  certificadoISSCA: boolean;
  workshopCellgenic: boolean;
  estado: string;
  createdAt: string;
  _count: {
    solicitudes: number;
    pacientes: number;
  };
}

export interface PacienteDetalle {
  id: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string | null;
  edad: number | null;
  sexo: string | null;
  telefono: string | null;
  email: string | null;
  medicoId: string;
  medico: { nombre: string };
  createdAt: string;
  _count: {
    solicitudes: number;
  };
}

export interface SolicitudDetalle {
  id: string;
  numero: string;
  estado: string;
  estadoPago: string | null;
  medicoId: string;
  pacienteId: string;
  diagnosticoPrincipal: string | null;
  objetivoTerapeutico: string | null;
  categoriaProducto: string | null;
  nombreProducto: string | null;
  cantidadSolicitada: number | null;
  viaAdministracion: string | null;
  fechaAplicacion: string | null;
  tipoEntrega: string | null;
  montoTotal: number | null;
  createdAt: string;
  updatedAt: string;
  medico: { nombre: string; especialidad: string | null };
  paciente: { nombre: string; dni: string };
  createdBy: { name: string };
  documentos: { id: string; tipo: string; nombre: string }[];
  fulfillment: {
    estado: string;
    loteAsignado: string | null;
    metodoEnvio: string | null;
    tracking: string | null;
  } | null;
  evidencia: {
    estado: string;
    nombreReceptor: string | null;
    fechaHoraEntrega: string | null;
  } | null;

  // Checklists
  medicoRegistrado: boolean;
  medicoValidado: boolean;
  historiaClinicaRecibida: boolean;
  consentimientoRecibido: boolean;
  ordenMedicaRecibida: boolean;
  documentacionCompleta: boolean;
}

export interface InventarioItem {
  id: string;
  productoId: string;
  producto: {
    id: string;
    nombre: string;
    sku: string;
    categoria: string;
    precioUnitario: number;
    requiereFrio: boolean;
  };
  lote: string;
  cantidad: number;
  fechaVencimiento: string | null;
  ubicacion: string;
  tipoAlmacenamiento: string;
  umbralMinimo: number;
  status: "ok" | "bajo" | "critico" | "agotado";
}

export interface FulfillmentDetalle {
  id: string;
  solicitudId: string;
  loteAsignado: string | null;
  productoReservado: string | null;
  cantidad: number | null;
  fechaPreparacion: string | null;
  fechaDespacho: string | null;
  metodoEnvio: string | null;
  tracking: string | null;
  temperaturaEnvio: string | null;
  estado: string;
  solicitud: {
    numero: string;
    nombreProducto: string | null;
    medico: { nombre: string };
    paciente: { nombre: string };
  };
  responsable: { name: string } | null;
}

export interface EvidenciaDetalle {
  id: string;
  solicitudId: string;
  nombreReceptor: string | null;
  dniReceptor: string | null;
  fechaHoraEntrega: string | null;
  firmaUrl: string | null;
  fotoUrl: string | null;
  observaciones: string | null;
  estado: string;
  solicitud: {
    numero: string;
    medico: { nombre: string };
    paciente: { nombre: string };
  };
  creadoPor: { name: string };
}
