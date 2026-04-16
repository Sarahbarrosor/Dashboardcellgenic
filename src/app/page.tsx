"use client";

import { useEffect, useState } from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  CheckSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatCurrency, formatDate, getSeverityColor } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        // Only set data if it's valid (no error field and has expected structure)
        if (d && typeof d.totalProducts === "number") setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="h-96" />;
  if (!data) return (
    <div className="text-center text-gray-500 py-12">
      <p className="text-sm">Dashboard data unavailable.</p>
      <p className="text-xs mt-1">The database may not be initialized yet. Use the banner above to seed demo data.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Products"
          value={data.totalProducts.toString()}
          icon={Package}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Inventory Value"
          value={formatCurrency(data.totalInventoryValue)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Low Stock Items"
          value={data.lowStockCount.toString()}
          icon={AlertTriangle}
          iconColor={data.lowStockCount > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}
        />
        <MetricCard
          title="Pending Orders"
          value={data.pendingOrders.toString()}
          icon={ShoppingCart}
          iconColor="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Open Tasks"
          value={data.pendingTasks.toString()}
          icon={CheckSquare}
          iconColor="bg-orange-100 text-orange-600"
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(data.monthlyRevenue)}
          change={
            data.revenueChange !== 0
              ? `${data.revenueChange > 0 ? "+" : ""}${data.revenueChange}% vs last month`
              : undefined
          }
          changeType={data.revenueChange > 0 ? "positive" : data.revenueChange < 0 ? "negative" : "neutral"}
          icon={TrendingUp}
          iconColor="bg-brand-100 text-brand-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Revenue Trend (Last 30 Days)</h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.salesTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Top Products</h3>
          </div>
          <div className="card-body">
            {data.topProducts.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => (v.length > 15 ? v.slice(0, 15) + "..." : v)}
                    />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No sales data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Recent Alerts</h3>
            <a href="/alerts" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              View all
            </a>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentAlerts.length > 0 ? (
              data.recentAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`px-6 py-3 border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
                    </div>
                    <span className="text-xs whitespace-nowrap opacity-60">
                      {formatDate(alert.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No active alerts
              </div>
            )}
          </div>
        </div>

        {/* Inventory by Location */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Inventory by Location</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.inventoryByLocation.length > 0 ? (
              data.inventoryByLocation.map((loc) => (
                <div key={loc.location} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{loc.location}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {loc.totalItems} items &middot; {formatCurrency(loc.totalValue)} value
                    </p>
                  </div>
                  {loc.lowStockItems > 0 && (
                    <span className="badge bg-red-100 text-red-700">
                      {loc.lowStockItems} low stock
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-500">
                No inventory data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
