"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface SalesData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalQuantitySold: number;
    allTimeRevenue: number;
    allTimeOrders: number;
  };
  topProducts: {
    productId: string;
    name: string;
    sku: string;
    category: string;
    totalRevenue: number;
    totalQuantity: number;
    orderCount: number;
  }[];
  channelBreakdown: {
    channel: string;
    revenue: number;
    quantity: number;
    orders: number;
  }[];
  categoryBreakdown: {
    category: string;
    revenue: number;
    quantity: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
    quantity: number;
    orders: number;
  }[];
  recentSales: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    channel: string;
    customerName: string | null;
    saleDate: string;
    product: { name: string; sku: string };
  }[];
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function SalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales?days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading && !data) return <LoadingSpinner className="h-96" />;
  if (!data) return <p className="text-center text-gray-500 py-12">Failed to load sales data.</p>;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Showing data for the last {days} days</p>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {[30, 60, 90, 180, 365].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                days === d ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Period Revenue"
          value={formatCurrency(data.summary.totalRevenue)}
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Total Orders"
          value={data.summary.totalOrders.toString()}
          icon={ShoppingBag}
          iconColor="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.summary.avgOrderValue)}
          icon={BarChart3}
          iconColor="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Units Sold"
          value={data.summary.totalQuantitySold.toString()}
          icon={TrendingUp}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Monthly Revenue Trend</h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number, name: string) => [
                    name === "revenue" ? formatCurrency(value) : value,
                    name === "revenue" ? "Revenue" : "Orders"
                  ]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Sales by Channel</h3>
          </div>
          <div className="card-body">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.channelBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="revenue"
                    nameKey="channel"
                    label={({ channel, percent }) =>
                      `${channel} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.channelBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Top Products by Revenue</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {data.topProducts.slice(0, 10).map((product, index) => (
              <div key={product.productId} className="px-6 py-3 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
                    {product.sku} &middot; {product.totalQuantity} sold &middot; {product.orderCount} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.totalRevenue)}</p>
                </div>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No sales data yet</div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-900">Revenue by Category</h3>
          </div>
          <div className="card-body">
            {data.categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.categoryBreakdown.map((cat) => {
                  const maxRevenue = data.categoryBreakdown[0]?.revenue || 1;
                  const pct = (cat.revenue / maxRevenue) * 100;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.revenue)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{cat.quantity} units sold</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-8">No category data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-900">Recent Sales</h3>
        </div>
        {data.recentSales.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Channel</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.slice(0, 20).map((sale) => (
                  <tr key={sale.id}>
                    <td className="font-medium text-gray-900">{sale.product.name}</td>
                    <td><span className="badge bg-gray-100 text-gray-700">{sale.channel}</span></td>
                    <td>{sale.customerName || "-"}</td>
                    <td>{sale.quantity}</td>
                    <td>{formatCurrency(sale.unitPrice)}</td>
                    <td className="font-semibold">{formatCurrency(sale.totalAmount)}</td>
                    <td className="text-gray-500">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-500">No recent sales</div>
        )}
      </div>
    </div>
  );
}
