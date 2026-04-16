"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowRightLeft,
  Plus,
  X,
  Package,
  MapPin,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Send,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { formatDateTime, formatDate, cn, getPriorityColor } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  code: string | null;
  type: string;
  city: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
}

interface TransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantityRequested: number;
  quantityShipped: number | null;
  quantityReceived: number | null;
  unitCost: number | null;
  notes: string | null;
  product?: Product;
}

interface Transfer {
  id: string;
  transferNumber: string;
  fromLocationId: string;
  toLocationId: string;
  status: string;
  priority: string;
  reason: string | null;
  notes: string | null;
  trackingNumber: string | null;
  shippingMethod: string | null;
  estimatedArrival: string | null;
  requestedAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  fromLocation: Location;
  toLocation: Location;
  requestedBy: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  receivedBy: { id: string; name: string } | null;
  items: TransferItem[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
  }[];
}

interface TransfersResponse {
  transfers: Transfer[];
  summary: {
    total: number;
    requested: number;
    approved: number;
    inTransit: number;
    received: number;
    rejected: number;
    cancelled: number;
  };
}

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock }> = {
  requested: { label: "Requested", class: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Approved", class: "bg-blue-100 text-blue-700", icon: CheckCircle },
  in_transit: { label: "In Transit", class: "bg-purple-100 text-purple-700", icon: Truck },
  received: { label: "Received", class: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", class: "bg-red-100 text-red-700", icon: X },
  cancelled: { label: "Cancelled", class: "bg-gray-100 text-gray-700", icon: X },
};

const priorityLabels: Record<string, string> = {
  low: "Low", normal: "Normal", high: "High", urgent: "Urgent",
};

export default function TransfersPage() {
  const [data, setData] = useState<TransfersResponse | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "incoming" | "outgoing">("all");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [currentUserLocationId, setCurrentUserLocationId] = useState<string>("");

  const [newTransfer, setNewTransfer] = useState({
    fromLocationId: "",
    toLocationId: "",
    priority: "normal",
    reason: "",
    notes: "",
    items: [{ productId: "", quantityRequested: 1 }] as { productId: string; quantityRequested: number }[],
  });

  const [trackingInputs, setTrackingInputs] = useState<Record<string, { trackingNumber: string; shippingMethod: string }>>({});

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/transfers?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch("/api/locations").then((r) => r.json()).then((d) => setLocations(d.locations));
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products));
  }, []);

  const createTransfer = async () => {
    if (!newTransfer.fromLocationId || !newTransfer.toLocationId) return;
    if (newTransfer.fromLocationId === newTransfer.toLocationId) {
      alert("Source and destination must be different locations");
      return;
    }
    const validItems = newTransfer.items.filter((i) => i.productId && i.quantityRequested > 0);
    if (validItems.length === 0) return;

    await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTransfer, items: validItems }),
    });

    setShowNewForm(false);
    setNewTransfer({
      fromLocationId: "", toLocationId: "", priority: "normal", reason: "", notes: "",
      items: [{ productId: "", quantityRequested: 1 }],
    });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const extras = trackingInputs[id];
    await fetch("/api/transfers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        ...(status === "in_transit" && extras && {
          trackingNumber: extras.trackingNumber,
          shippingMethod: extras.shippingMethod,
        }),
      }),
    });
    fetchData();
  };

  const addComment = async (transferId: string) => {
    const content = commentText[transferId];
    if (!content?.trim()) return;
    await fetch("/api/transfers/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transferId, content }),
    });
    setCommentText({ ...commentText, [transferId]: "" });
    fetchData();
  };

  const addItemRow = () => {
    setNewTransfer({
      ...newTransfer,
      items: [...newTransfer.items, { productId: "", quantityRequested: 1 }],
    });
  };

  const updateItem = (idx: number, field: "productId" | "quantityRequested", value: string | number) => {
    const items = [...newTransfer.items];
    items[idx] = { ...items[idx], [field]: value };
    setNewTransfer({ ...newTransfer, items });
  };

  const removeItem = (idx: number) => {
    setNewTransfer({
      ...newTransfer,
      items: newTransfer.items.filter((_, i) => i !== idx),
    });
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  const filteredTransfers = (data?.transfers || []).filter((t) => {
    if (search && !t.transferNumber.toLowerCase().includes(search.toLowerCase()) &&
      !t.fromLocation.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.toLocation.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === "incoming" && currentUserLocationId && t.toLocationId !== currentUserLocationId) return false;
    if (tab === "outgoing" && currentUserLocationId && t.fromLocationId !== currentUserLocationId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard title="Total" value={data.summary.total.toString()} icon={ArrowRightLeft} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="Requested" value={data.summary.requested.toString()} icon={Clock} iconColor="bg-yellow-100 text-yellow-600" />
          <MetricCard title="Approved" value={data.summary.approved.toString()} icon={CheckCircle} iconColor="bg-blue-100 text-blue-600" />
          <MetricCard title="In Transit" value={data.summary.inTransit.toString()} icon={Truck} iconColor="bg-purple-100 text-purple-600" />
          <MetricCard title="Received" value={data.summary.received.toString()} icon={Package} iconColor="bg-green-100 text-green-600" />
          <MetricCard title="Rejected/Cancelled" value={(data.summary.rejected + data.summary.cancelled).toString()} icon={X} iconColor="bg-gray-100 text-gray-600" />
        </div>
      )}

      {/* Actions & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 flex-1">
          {/* View as Location selector */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">View as location</label>
            <select
              value={currentUserLocationId}
              onChange={(e) => setCurrentUserLocationId(e.target.value)}
              className="select w-auto text-xs"
            >
              <option value="">Everything</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Direction</label>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {(["all", "incoming", "outgoing"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  disabled={t !== "all" && !currentUserLocationId}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                    tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                    t !== "all" && !currentUserLocationId && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select w-auto">
              <option value="">All</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Search</label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input type="text" placeholder="TRF-1001 or location..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary mt-5">
          <Plus className="h-4 w-4" /> Request Transfer
        </button>
      </div>

      {/* New Transfer Form */}
      {showNewForm && (
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Request Transfer Between Locations</h3>
              <p className="text-xs text-gray-500 mt-0.5">Submit a request for items to be moved. The source location will be notified for approval.</p>
            </div>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label">From Location (Source) *</label>
              <select value={newTransfer.fromLocationId} onChange={(e) => setNewTransfer({ ...newTransfer, fromLocationId: e.target.value })} className="select">
                <option value="">Select source...</option>
                {locations.map((l) => <option key={l.id} value={l.id} disabled={l.id === newTransfer.toLocationId}>{l.name} ({l.code})</option>)}
              </select>
            </div>
            <div>
              <label className="label">To Location (Destination) *</label>
              <select value={newTransfer.toLocationId} onChange={(e) => setNewTransfer({ ...newTransfer, toLocationId: e.target.value })} className="select">
                <option value="">Select destination...</option>
                {locations.map((l) => <option key={l.id} value={l.id} disabled={l.id === newTransfer.fromLocationId}>{l.name} ({l.code})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={newTransfer.priority} onChange={(e) => setNewTransfer({ ...newTransfer, priority: e.target.value })} className="select">
                {Object.entries(priorityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Reason</label>
              <input type="text" value={newTransfer.reason} onChange={(e) => setNewTransfer({ ...newTransfer, reason: e.target.value })} className="input" placeholder="e.g. Restocking retail floor" />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="label m-0">Items to Transfer</label>
              <button onClick={addItemRow} className="btn-ghost text-xs">
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {newTransfer.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(idx, "productId", e.target.value)}
                    className="select flex-1"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantityRequested}
                    onChange={(e) => updateItem(idx, "quantityRequested", parseInt(e.target.value) || 1)}
                    className="input w-24"
                    min={1}
                    placeholder="Qty"
                  />
                  {newTransfer.items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="btn-ghost text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Additional Notes</label>
            <textarea value={newTransfer.notes} onChange={(e) => setNewTransfer({ ...newTransfer, notes: e.target.value })} className="input" rows={2} placeholder="Any special instructions..." />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={createTransfer} className="btn-primary">
              <Send className="h-4 w-4" /> Submit Request
            </button>
          </div>
        </div>
      )}

      {/* Transfers List */}
      {filteredTransfers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ArrowRightLeft}
            title="No transfers found"
            description="Create your first transfer request between locations."
            action={
              <button onClick={() => setShowNewForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> Request Transfer
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransfers.map((transfer) => {
            const cfg = statusConfig[transfer.status];
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === transfer.id;
            const isIncoming = currentUserLocationId && transfer.toLocationId === currentUserLocationId;
            const isOutgoing = currentUserLocationId && transfer.fromLocationId === currentUserLocationId;

            return (
              <div
                key={transfer.id}
                className={cn(
                  "card",
                  transfer.status === "requested" && isOutgoing && "ring-2 ring-yellow-400",
                  transfer.status === "in_transit" && isIncoming && "ring-2 ring-purple-400"
                )}
              >
                <div
                  className="card-body flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : transfer.id)}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0", cfg.class)}>
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{transfer.transferNumber}</h3>
                      <span className={cn("badge", cfg.class)}>{cfg.label}</span>
                      <span className={cn("badge", getPriorityColor(transfer.priority))}>
                        {priorityLabels[transfer.priority]}
                      </span>
                      {transfer.status === "requested" && isOutgoing && (
                        <span className="badge bg-yellow-100 text-yellow-800 animate-pulse">
                          <AlertCircle className="h-3 w-3 mr-1" /> Awaiting your approval
                        </span>
                      )}
                      {transfer.status === "in_transit" && isIncoming && (
                        <span className="badge bg-purple-100 text-purple-800 animate-pulse">
                          <Truck className="h-3 w-3 mr-1" /> Incoming to you
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {transfer.fromLocation.name}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="flex items-center gap-1 font-medium text-gray-700">
                        <MapPin className="h-3 w-3" /> {transfer.toLocation.name}
                      </span>
                      <span className="mx-1">&middot;</span>
                      <span>{transfer.items.length} item(s)</span>
                      <span className="mx-1">&middot;</span>
                      <span>Requested by {transfer.requestedBy.name}</span>
                      <span className="mx-1">&middot;</span>
                      <span>{formatDateTime(transfer.requestedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {transfer.estimatedArrival && transfer.status === "in_transit" && (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase">ETA</p>
                        <p className="text-xs font-semibold text-gray-900">{formatDate(transfer.estimatedArrival)}</p>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Reason */}
                    {transfer.reason && (
                      <div className="px-6 py-3 bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Reason</p>
                        <p className="text-sm text-gray-700">{transfer.reason}</p>
                      </div>
                    )}

                    {/* Items Table */}
                    <div className="px-6 py-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</h4>
                      <div className="table-container">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>SKU</th>
                              <th>Requested</th>
                              <th>Shipped</th>
                              <th>Received</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transfer.items.map((item) => (
                              <tr key={item.id}>
                                <td className="font-medium">{item.product?.name || "Unknown"}</td>
                                <td className="text-gray-500 font-mono text-xs">{item.product?.sku || ""}</td>
                                <td className="font-semibold">{item.quantityRequested}</td>
                                <td>{item.quantityShipped ?? "-"}</td>
                                <td>{item.quantityReceived ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Shipping Info */}
                    {(transfer.trackingNumber || transfer.shippingMethod) && (
                      <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-6">
                        {transfer.trackingNumber && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Tracking</p>
                            <p className="text-sm font-mono">{transfer.trackingNumber}</p>
                          </div>
                        )}
                        {transfer.shippingMethod && (
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase">Method</p>
                            <p className="text-sm capitalize">{transfer.shippingMethod.replace("_", " ")}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="px-6 py-3 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Requested</p>
                          <p className="font-medium">{formatDateTime(transfer.requestedAt)}</p>
                          <p className="text-gray-500 mt-0.5">by {transfer.requestedBy.name}</p>
                        </div>
                        {transfer.approvedAt && (
                          <div>
                            <p className="text-gray-400">Approved</p>
                            <p className="font-medium">{formatDateTime(transfer.approvedAt)}</p>
                            {transfer.approvedBy && <p className="text-gray-500 mt-0.5">by {transfer.approvedBy.name}</p>}
                          </div>
                        )}
                        {transfer.shippedAt && (
                          <div>
                            <p className="text-gray-400">Shipped</p>
                            <p className="font-medium">{formatDateTime(transfer.shippedAt)}</p>
                          </div>
                        )}
                        {transfer.receivedAt && (
                          <div>
                            <p className="text-gray-400">Received</p>
                            <p className="font-medium">{formatDateTime(transfer.receivedAt)}</p>
                            {transfer.receivedBy && <p className="text-gray-500 mt-0.5">by {transfer.receivedBy.name}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Actions</p>
                      <div className="flex flex-wrap items-center gap-2">
                        {transfer.status === "requested" && (
                          <>
                            <button onClick={() => updateStatus(transfer.id, "approved")} className="btn-primary text-xs">
                              <CheckCircle className="h-3.5 w-3.5" /> Approve Request
                            </button>
                            <button onClick={() => updateStatus(transfer.id, "rejected")} className="btn-danger text-xs">
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                            <button onClick={() => updateStatus(transfer.id, "cancelled")} className="btn-secondary text-xs">
                              Cancel
                            </button>
                          </>
                        )}
                        {transfer.status === "approved" && (
                          <div className="flex flex-wrap items-end gap-2 w-full">
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Tracking #</label>
                              <input
                                type="text"
                                value={trackingInputs[transfer.id]?.trackingNumber || ""}
                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [transfer.id]: { ...trackingInputs[transfer.id], trackingNumber: e.target.value } })}
                                className="input text-sm"
                                placeholder="Optional"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-1">Method</label>
                              <select
                                value={trackingInputs[transfer.id]?.shippingMethod || "internal_fleet"}
                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [transfer.id]: { ...trackingInputs[transfer.id], shippingMethod: e.target.value } })}
                                className="select text-sm"
                              >
                                <option value="internal_fleet">Internal Fleet</option>
                                <option value="courier">Courier</option>
                                <option value="pickup">Pickup</option>
                              </select>
                            </div>
                            <button onClick={() => updateStatus(transfer.id, "in_transit")} className="btn-primary text-xs">
                              <Truck className="h-3.5 w-3.5" /> Mark as Shipped
                            </button>
                          </div>
                        )}
                        {transfer.status === "in_transit" && (
                          <button onClick={() => updateStatus(transfer.id, "received")} className="btn-primary text-xs">
                            <Package className="h-3.5 w-3.5" /> Confirm Received
                          </button>
                        )}
                        {["received", "rejected", "cancelled"].includes(transfer.status) && (
                          <p className="text-xs text-gray-500 italic">Transfer is closed. No further actions available.</p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {transfer.notes && (
                      <div className="px-6 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{transfer.notes}</p>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="px-6 py-4 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Communication</h4>
                      <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                        {transfer.comments.map((comment) => (
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
                        {transfer.comments.length === 0 && <p className="text-xs text-gray-400">No messages yet</p>}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a message..."
                          value={commentText[transfer.id] || ""}
                          onChange={(e) => setCommentText({ ...commentText, [transfer.id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && addComment(transfer.id)}
                          className="input flex-1"
                        />
                        <button onClick={() => addComment(transfer.id)} className="btn-primary px-3">
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
