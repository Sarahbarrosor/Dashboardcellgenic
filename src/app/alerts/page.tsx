"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  X,
  RefreshCw,
  Info,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
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

const severityIcons: Record<string, typeof AlertTriangle> = {
  info: Info,
  warning: AlertCircle,
  critical: XCircle,
};

const typeLabels: Record<string, string> = {
  low_stock: "Low Stock",
  reorder: "Reorder Needed",
  overdue_task: "Overdue Task",
  order_status: "Order Status",
  system: "System",
};

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    fetch(`/api/alerts?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateAlerts = async () => {
    await fetch("/api/alerts", { method: "POST" });
    fetchData();
  };

  const dismissAlert = async (id: string) => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isDismissed: true, isRead: true }),
    });
    fetchData();
  };

  const markRead = async (id: string) => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isRead: true }),
    });
    fetchData();
  };

  const dismissAll = async () => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dismissAll: true }),
    });
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <MetricCard title="Total Alerts" value={data.summary.total.toString()} icon={Bell} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="Unread" value={data.summary.unread.toString()} icon={Bell} iconColor="bg-yellow-100 text-yellow-600" />
          <MetricCard title="Critical" value={data.summary.critical.toString()} icon={XCircle} iconColor="bg-red-100 text-red-600" />
          <MetricCard title="Warnings" value={data.summary.warning.toString()} icon={AlertCircle} iconColor="bg-orange-100 text-orange-600" />
          <MetricCard title="Info" value={data.summary.info.toString()} icon={Info} iconColor="bg-blue-100 text-blue-600" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="select w-auto">
            <option value="">All Types</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={generateAlerts} className="btn-secondary">
            <RefreshCw className="h-4 w-4" /> Check for Alerts
          </button>
          {(data?.summary.total || 0) > 0 && (
            <button onClick={dismissAll} className="btn-secondary">
              <Check className="h-4 w-4" /> Dismiss All
            </button>
          )}
        </div>
      </div>

      {/* Alert List */}
      {!data?.alerts.length ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title="No active alerts"
            description="All clear! Generate alerts to check for low stock and overdue tasks."
            action={
              <button onClick={generateAlerts} className="btn-primary">
                <RefreshCw className="h-4 w-4" /> Check Now
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {data.alerts.map((alert) => {
            const Icon = severityIcons[alert.severity] || AlertCircle;
            return (
              <div
                key={alert.id}
                className={cn(
                  "card card-body flex items-start gap-4 border-l-4 transition-colors",
                  getSeverityColor(alert.severity),
                  !alert.isRead && "ring-1 ring-inset ring-gray-200"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0 mt-0.5",
                  alert.severity === "critical" && "text-red-500",
                  alert.severity === "warning" && "text-yellow-500",
                  alert.severity === "info" && "text-blue-500"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                    <span className="badge bg-white/50 text-[10px]">{typeLabels[alert.type] || alert.type}</span>
                    {!alert.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-sm mt-0.5 opacity-80">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-50">{formatDateTime(alert.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!alert.isRead && (
                    <button onClick={() => markRead(alert.id)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title="Mark as read">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => dismissAlert(alert.id)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors" title="Dismiss">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
