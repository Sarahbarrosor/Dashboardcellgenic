"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  X,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { formatCurrency, formatDateTime, cn, getStatusColor } from "@/lib/utils";
import type { OrderWithDetails } from "@/types";

interface OrdersResponse {
  orders: OrderWithDetails[];
  summary: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    totalValue: number;
  };
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const typeLabels: Record<string, string> = {
  sales: "Sales Order",
  purchase: "Purchase Order",
  internal: "Internal Order",
};

export default function OrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    type: "sales",
    customerName: "",
    customerEmail: "",
    supplierName: "",
    notes: "",
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    fetch(`/api/orders?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createOrder = async () => {
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrder),
    });
    setShowNewForm(false);
    setNewOrder({ type: "sales", customerName: "", customerEmail: "", supplierName: "", notes: "" });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchData();
  };

  const addComment = async (orderId: string) => {
    if (!commentText.trim()) return;
    await fetch("/api/orders/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, content: commentText }),
    });
    setCommentText("");
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Total Orders" value={data.summary.total.toString()} icon={ShoppingCart} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="Pending" value={data.summary.pending.toString()} icon={ShoppingCart} iconColor="bg-yellow-100 text-yellow-600" />
          <MetricCard title="Processing" value={data.summary.processing.toString()} icon={ShoppingCart} iconColor="bg-indigo-100 text-indigo-600" />
          <MetricCard title="Shipped" value={data.summary.shipped.toString()} icon={Package} iconColor="bg-purple-100 text-purple-600" />
          <MetricCard title="Delivered" value={data.summary.delivered.toString()} icon={Package} iconColor="bg-green-100 text-green-600" />
          <MetricCard title="Total Value" value={formatCurrency(data.summary.totalValue)} icon={ShoppingCart} iconColor="bg-brand-100 text-brand-600" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <Search className="h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select w-auto">
            <option value="">All Statuses</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="select w-auto">
            <option value="">All Types</option>
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      {/* New Order Form */}
      {showNewForm && (
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">New Order</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Order Type</label>
              <select value={newOrder.type} onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value })} className="select">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {newOrder.type !== "purchase" && (
              <>
                <div>
                  <label className="label">Customer Name</label>
                  <input type="text" value={newOrder.customerName} onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Customer Email</label>
                  <input type="email" value={newOrder.customerEmail} onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })} className="input" />
                </div>
              </>
            )}
            {newOrder.type === "purchase" && (
              <div>
                <label className="label">Supplier Name</label>
                <input type="text" value={newOrder.supplierName} onChange={(e) => setNewOrder({ ...newOrder, supplierName: e.target.value })} className="input" />
              </div>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="label">Notes</label>
              <textarea value={newOrder.notes} onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })} className="input" rows={2} />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={createOrder} className="btn-primary">Create Order</button>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!data?.orders.length ? (
        <div className="card">
          <EmptyState icon={ShoppingCart} title="No orders found" description="Create your first order to get started." />
        </div>
      ) : (
        <div className="space-y-3">
          {data.orders.map((order) => {
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} className="card">
                <div
                  className="card-body flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{order.orderNumber}</h3>
                      <span className={cn("badge", getStatusColor(order.status))}>{statusLabels[order.status]}</span>
                      <span className="badge bg-gray-100 text-gray-600">{typeLabels[order.type]}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {order.customerName || order.supplierName || "No customer"} &middot;
                      Created by {order.createdBy.name} &middot; {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{order.items.length} items</p>
                    </div>
                    {order.comments.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs">{order.comments.length}</span>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Order Items */}
                    {order.items.length > 0 && (
                      <div className="px-6 py-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</h4>
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th>SKU</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="font-medium">{item.product.name}</td>
                                  <td className="text-gray-500 font-mono text-xs">{item.product.sku}</td>
                                  <td>{item.quantity}</td>
                                  <td>{formatCurrency(item.unitPrice)}</td>
                                  <td className="font-semibold">{formatCurrency(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="px-6 py-3 bg-gray-50 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 mr-2">Change status:</span>
                      {Object.entries(statusLabels)
                        .filter(([k]) => k !== order.status)
                        .map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => updateStatus(order.id, k)}
                            className={cn("badge cursor-pointer hover:opacity-80 transition-opacity", getStatusColor(k))}
                          >
                            {v}
                          </button>
                        ))}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="px-6 py-3 border-t border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Notes</h4>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                      </div>
                    )}

                    {/* Comments / Communication */}
                    <div className="px-6 py-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Communication Log</h4>
                      <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                        {order.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex-shrink-0">
                              {comment.user.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-900">{comment.user.name}</span>
                                <span className="text-[10px] text-gray-400">{formatDateTime(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                        {order.comments.length === 0 && (
                          <p className="text-xs text-gray-400">No comments yet</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={expandedId === order.id ? commentText : ""}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addComment(order.id)}
                          className="input flex-1"
                        />
                        <button onClick={() => addComment(order.id)} className="btn-primary px-3">
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
