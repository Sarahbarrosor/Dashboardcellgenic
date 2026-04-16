"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrency, cn } from "@/lib/utils";
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

const statusConfig: Record<string, { label: string; class: string }> = {
  ok: { label: "In Stock", class: "bg-green-100 text-green-700" },
  low: { label: "Low Stock", class: "bg-yellow-100 text-yellow-700" },
  critical: { label: "Critical", class: "bg-red-100 text-red-700" },
  out_of_stock: { label: "Out of Stock", class: "bg-gray-100 text-gray-700" },
};

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ quantity: 0, minimumThreshold: 0 });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterLocation) params.set("location", filterLocation);
    fetch(`/api/inventory?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterLocation]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {!data?.items.length ? (
          <EmptyState icon={Package} title="No inventory items" description="Inventory data will appear here once products are added." />
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
    </div>
  );
}
