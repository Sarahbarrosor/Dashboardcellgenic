import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getEstadoColor(estado: string): string {
  const colors: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    validacion_documental: "bg-blue-100 text-blue-800",
    aprobado: "bg-green-100 text-green-800",
    en_preparacion: "bg-purple-100 text-purple-800",
    despachado: "bg-orange-100 text-orange-800",
    entregado: "bg-emerald-100 text-emerald-800",
    cerrado: "bg-gray-100 text-gray-800",
    rechazado: "bg-red-100 text-red-800",
    validado: "bg-green-100 text-green-800",
    confirmado: "bg-green-100 text-green-800",
    preparando: "bg-blue-100 text-blue-800",
    listo: "bg-purple-100 text-purple-800",
    confirmada: "bg-green-100 text-green-800",
  };
  return colors[estado] || "bg-gray-100 text-gray-800";
}

export function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    pendiente: "Pendiente",
    validacion_documental: "Validación Doc.",
    aprobado: "Aprobado",
    en_preparacion: "En Preparación",
    despachado: "Despachado",
    entregado: "Entregado",
    cerrado: "Cerrado",
    rechazado: "Rechazado",
    validado: "Validado",
    confirmado: "Confirmado",
    preparando: "Preparando",
    listo: "Listo",
    confirmada: "Confirmada",
  };
  return labels[estado] || estado;
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    critical: "bg-red-50 border-red-200 text-red-800",
  };
  return colors[severity] || "bg-gray-50 border-gray-200 text-gray-800";
}
