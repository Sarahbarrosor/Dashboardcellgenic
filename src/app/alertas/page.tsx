"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  X,
  Info,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, cn, getSeverityColor } from "@/lib/utils";
import type { AlertData } from "@/types";

interface AlertsResponse {
  alerts: AlertData[];
  summary: {
    total: number;
    unread: number;
    critical: number;
    warning: number;
    info: number;
  };
}

type SeverityFilter = "" | "critical" | "warning" | "info";

const severityFilters: { value: SeverityFilter; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "critical", label: "Criticas" },
  { value: "warning", label: "Advertencias" },
  { value: "info", label: "Informacion" },
];

function SeverityIcon({ severity, className }: { severity: string; className?: string }) {
  if (severity === "critical") {
    return <AlertTriangle className={cn("h-5 w-5 text-red-500", className)} />;
  }
  if (severity === "warning") {
    return <AlertTriangle className={cn("h-5 w-5 text-yellow-500", className)} />;
  }
  return <Info className={cn("h-5 w-5 text-blue-500", className)} />;
}

export default function AlertasPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>("");
  const [dismissing, setDismissing] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSeverity) params.set("severity", filterSeverity);
    fetch(`/api/alertas?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterSeverity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const dismissAlert = async (id: string) => {
    setDismissing(id);
    try {
      await fetch("/api/alertas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchData();
    } catch (error) {
      console.error("Error dismissing alert:", error);
    } finally {
      setDismissing(null);
    }
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  const unreadCount = data?.summary.unread ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centro de Alertas</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} alerta{unreadCount !== 1 ? "s" : ""} sin leer
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-400" />
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card card-body">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{data.summary.total}</p>
          </div>
          <div className="card card-body">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-medium text-gray-500">Criticas</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
          </div>
          <div className="card card-body">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <p className="text-sm font-medium text-gray-500">Advertencias</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{data.summary.warning}</p>
          </div>
          <div className="card card-body">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-medium text-gray-500">Informacion</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{data.summary.info}</p>
          </div>
        </div>
      )}

      {/* Severity filter */}
      <div className="flex gap-2">
        {severityFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setFilterSeverity(filter.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filterSeverity === filter.value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {!data?.alerts.length ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="Sin alertas"
            description="No hay alertas activas para los filtros seleccionados."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "card card-body flex items-start gap-4 border-l-4 transition-colors",
                getSeverityColor(alert.severity),
                !alert.isRead && "ring-1 ring-inset ring-gray-200"
              )}
            >
              <SeverityIcon severity={alert.severity} className="flex-shrink-0 mt-0.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold">{alert.title}</h3>
                  {!alert.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-sm mt-1 opacity-80">{alert.message}</p>
                <p className="text-xs mt-2 opacity-50">{formatDateTime(alert.createdAt)}</p>
              </div>

              <button
                onClick={() => dismissAlert(alert.id)}
                disabled={dismissing === alert.id}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5 transition-colors disabled:opacity-50 flex-shrink-0"
                title="Descartar"
              >
                {dismissing === alert.id ? (
                  <Check className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Descartar</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
