"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Search,
  RefreshCw,
  Edit2,
  Check,
  X,
  History,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import type { InventoryItem } from "@/types";

interface InventoryResponse {
  items: InventoryItem[];
  locations: string[];
  summary: {
    total: number;
    ok: number;
    low: number;
    critical: number;
    outOfStock: number;
  };
}

interface HistoryEntry {
  id: string;
  productId: string;
  location: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  changeType: string;
  source: string;
  syncId: string | null;
  notes: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
}

interface SyncLogEntry {
  id: string;
  scope: string;
  status: string;
  trigger: string;
  productsCreated: number;
  productsUpdated: number;
  inventorySynced: number;
  inventoryChanged: number;
  locationsCreated: number;
  locationsUpdated: number;
  ordersCreated: number;
  ordersUpdated: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  ok: { label: "In Stock", class: "bg-green-100 text-green-700" },
  low: { label: "Low Stock", class: "bg-yellow-100 text-yellow-700" },
  critical: { label: "Critical", class: "bg-red-100 text-red-700" },
  out_of_stock: { label: "Out of Stock", class: "bg-gray-100 text-gray-700" },
};

const sourceLabels: Record<string, string> = {
  katana: "Katana Sync",
  manual: "Manual",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  system: "System",
};

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ quantity: 0, minimumThreshold: 0 });
  const [tab, setTab] = useState<"inventory" | "history" | "syncs">("inventory");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterLocation) params.set("location", filterLocation);
    fetch(`/api/inventory?${params}`)
      .then((res) => res.json())
      .then((d) => { if (d && Array.isArray(d.items)) setData(d); })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setLastRefresh(new Date());
      });
  }, [search, filterStatus, filterLocation]);

  const fetchHistory = useCallback(() => {
    setHistoryLoading(true);
    fetch("/api/inventory/history?limit=200")
      .then((res) => res.json())
      .then((d) => {
        if (Array.isArray(d?.history)) setHistory(d.history);
        if (Array.isArray(d?.syncLogs)) setSyncLogs(d.syncLogs);
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tab === "history" || tab === "syncs") fetchHistory();
  }, [tab, fetchHistory]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
      if (tab === "history" || tab === "syncs") fetchHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData, fetchHistory, tab]);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ quantity: item.quantity, minimumThreshold: item.minimumThreshold });
  };

  const saveEdit = async (id: string) => {
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editValues }),
    });
    setEditingId(null);
    fetchData();
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/katana/sync?scope=inventory", { method: "POST" });
      const d = await res.json();
      if (d.ok) {
        setSyncResult(`Synced ${d.inventory?.synced || 0} items, ${d.inventory?.changed || 0} changes detected`);
        fetchData();
        if (tab === "history" || tab === "syncs") fetchHistory();
      } else {
        setSyncResult(`Sync failed: ${d.error || "unknown error"}`);
      }
    } catch (err) {
      setSyncResult(`Sync failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    setSyncing(false);
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Total Items" value={data.summary.total.toString()} icon={Package} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="In Stock" value={data.summary.ok.toString()} icon={Package} iconColor="bg-green-100 text-green-600" />
          <MetricCard
            title="Low / Critical"
            value={(data.summary.low + data.summary.critical).toString()}
            icon={AlertTriangle}
            iconColor="bg-yellow-100 text-yellow-600"
          />
          <MetricCard
            title="Out of Stock"
            value={data.summary.outOfStock.toString()}
            icon={AlertTriangle}
            iconColor="bg-red-100 text-red-600"
          />
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(["inventory", "history", "syncs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md capitalize transition-colors flex items-center gap-1.5",
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t === "inventory" && <Package className="h-3.5 w-3.5" />}
              {t === "history" && <History className="h-3.5 w-3.5" />}
              {t === "syncs" && <Zap className="h-3.5 w-3.5" />}
              {t === "syncs" ? "Sync Log" : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600"
            />
            Auto-refresh (30s)
          </label>

          <span className="text-[10px] text-gray-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>

          <button onClick={runSync} disabled={syncing} className="btn-primary text-xs">
            {syncing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Sync Katana
          </button>

          <button onClick={() => { fetchData(); fetchHistory(); }} className="btn-secondary text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={cn(
          "rounded-lg border p-3 text-sm flex items-center gap-2",
          syncResult.includes("failed") ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
        )}>
          {syncResult.includes("failed") ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {syncResult}
        </div>
      )}

      {/* Inventory Tab */}
      {tab === "inventory" && (
        <>
          {/* Filters */}
          <div className="card card-body">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input"
                />
              </div>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select w-auto">
                <option value="">All Statuses</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="select w-auto">
                <option value="">All Locations</option>
                {data?.locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card">
            {!data?.items.length ? (
              <EmptyState icon={Package} title="No inventory items" description="Inventory data will appear here once products are added or synced from Katana." />
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Location</th>
                      <th>Quantity</th>
                      <th>Min Threshold</th>
                      <th>Reorder Point</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => {
                      const isEditing = editingId === item.id;
                      const cfg = statusConfig[item.status];
                      return (
                        <tr key={item.id}>
                          <td className="font-medium text-gray-900">{item.product.name}</td>
                          <td className="text-gray-500 font-mono text-xs">{item.product.sku}</td>
                          <td>{item.location}</td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.quantity}
                                onChange={(e) => setEditValues({ ...editValues, quantity: parseInt(e.target.value) || 0 })}
                                className="input w-20"
                              />
                            ) : (
                              <span className={cn("font-semibold", item.quantity <= item.minimumThreshold && "text-red-600")}>
                                {item.quantity}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                value={editValues.minimumThreshold}
                                onChange={(e) => setEditValues({ ...editValues, minimumThreshold: parseInt(e.target.value) || 0 })}
                                className="input w-20"
                              />
                            ) : (
                              item.minimumThreshold
                            )}
                          </td>
                          <td>{item.reorderPoint}</td>
                          <td>{formatCurrency(item.quantity * item.product.costPrice)}</td>
                          <td><span className={cn("badge", cfg.class)}>{cfg.label}</span></td>
                          <td>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                  <Check className="h-4 w-4" />
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(item)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Inventory Change History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Every inventory change from Katana syncs, transfers, and manual edits</p>
          </div>
          {historyLoading && !history.length ? (
            <LoadingSpinner className="h-48" />
          ) : !history.length ? (
            <EmptyState icon={History} title="No history yet" description="Changes will appear here after the first Katana sync or manual inventory update." />
          ) : (
            <div className="divide-y divide-gray-100">
              {history.map((entry) => (
                <div key={entry.id} className="px-6 py-3 flex items-center gap-4">
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0",
                    entry.changeQty > 0 ? "bg-green-100" : entry.changeQty < 0 ? "bg-red-100" : "bg-gray-100"
                  )}>
                    {entry.changeQty > 0 ? (
                      <ArrowUp className="h-4 w-4 text-green-600" />
                    ) : entry.changeQty < 0 ? (
                      <ArrowDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <Check className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{entry.product.name}</span>
                      <span className="text-xs text-gray-400 font-mono">{entry.product.sku}</span>
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">{entry.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      <span>{entry.previousQty} → {entry.newQty}</span>
                      <span className={cn(
                        "font-semibold",
                        entry.changeQty > 0 ? "text-green-600" : entry.changeQty < 0 ? "text-red-600" : "text-gray-400"
                      )}>
                        ({entry.changeQty > 0 ? "+" : ""}{entry.changeQty})
                      </span>
                      <span className="mx-1">&middot;</span>
                      <span className="badge bg-blue-50 text-blue-700 text-[10px]">{sourceLabels[entry.source] || entry.source}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sync Log Tab */}
      {tab === "syncs" && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Sync History</h3>
            <p className="text-xs text-gray-500 mt-0.5">Log of all Katana sync operations (auto every 5 min + manual)</p>
          </div>
          {historyLoading && !syncLogs.length ? (
            <LoadingSpinner className="h-48" />
          ) : !syncLogs.length ? (
            <EmptyState icon={Zap} title="No syncs yet" description="Run a sync from this page or wait for the automatic cron job." />
          ) : (
            <div className="divide-y divide-gray-100">
              {syncLogs.map((log) => (
                <div key={log.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "badge",
                        log.status === "completed" ? "bg-green-100 text-green-700" :
                        log.status === "running" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {log.status}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600 text-[10px] capitalize">{log.trigger}</span>
                      <span className="badge bg-gray-100 text-gray-600 text-[10px]">{log.scope}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDateTime(log.startedAt)}</span>
                  </div>
                  {log.status === "completed" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-400">Products</p>
                        <p className="font-semibold">{log.productsCreated} new, {log.productsUpdated} updated</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-400">Inventory</p>
                        <p className="font-semibold">{log.inventorySynced} synced, {log.inventoryChanged} changed</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-400">Locations</p>
                        <p className="font-semibold">{log.locationsCreated} new, {log.locationsUpdated} updated</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="text-gray-400">Orders</p>
                        <p className="font-semibold">{log.ordersCreated} new, {log.ordersUpdated} updated</p>
                      </div>
                    </div>
                  )}
                  {log.status === "failed" && log.errorMessage && (
                    <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                  )}
                  {log.completedAt && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Duration: {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
