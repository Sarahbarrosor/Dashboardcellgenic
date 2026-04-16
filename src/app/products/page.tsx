"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Database,
  Search,
  Plus,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, cn } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";

interface ProductsResponse {
  products: ProductWithDetails[];
  categories: string[];
}

const docTypeLabels: Record<string, string> = {
  coa: "Certificate of Analysis",
  first_party_test: "First-Party Test",
  third_party_test: "Third-Party Test",
  brochure: "Brochure",
  catalog: "Catalog",
  msds: "MSDS",
  other: "Other",
};

const docTypeColors: Record<string, string> = {
  coa: "bg-green-100 text-green-700",
  first_party_test: "bg-blue-100 text-blue-700",
  third_party_test: "bg-purple-100 text-purple-700",
  brochure: "bg-orange-100 text-orange-700",
  catalog: "bg-pink-100 text-pink-700",
  msds: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function ProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: "", name: "", description: "", category: "", unitPrice: 0, costPrice: 0,
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCategory) params.set("category", filterCategory);
    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProduct = async () => {
    if (!newProduct.sku || !newProduct.name || !newProduct.category) return;
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    setShowNewForm(false);
    setNewProduct({ sku: "", name: "", description: "", category: "", unitPrice: 0, costPrice: 0 });
    fetchData();
  };

  if (loading && !data) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{data?.products.length || 0} products in database</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* New Product Form */}
      {showNewForm && (
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">New Product</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">SKU *</label>
              <input type="text" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} className="input" placeholder="CG-001" />
            </div>
            <div>
              <label className="label">Name *</label>
              <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className="input" placeholder="Product Name" />
            </div>
            <div>
              <label className="label">Category *</label>
              <input type="text" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} className="input" placeholder="e.g. Supplements" list="categories" />
              <datalist id="categories">
                {data?.categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">Unit Price ($)</label>
              <input type="number" step="0.01" value={newProduct.unitPrice} onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })} className="input" />
            </div>
            <div>
              <label className="label">Cost Price ($)</label>
              <input type="number" step="0.01" value={newProduct.costPrice} onChange={(e) => setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) || 0 })} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <input type="text" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className="input" placeholder="Brief description" />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={createProduct} className="btn-primary">Create Product</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card card-body">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select w-auto">
            <option value="">All Categories</option>
            {data?.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {!data?.products.length ? (
        <div className="card">
          <EmptyState
            icon={Database}
            title="No products found"
            description="Add your first product to get started."
            action={
              <button onClick={() => setShowNewForm(true)} className="btn-primary">
                <Plus className="h-4 w-4" /> Add Product
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {data.products.map((product) => {
            const isExpanded = expandedId === product.id;
            const totalStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
            return (
              <div key={product.id} className="card">
                <div
                  className="card-body flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-xs flex-shrink-0">
                    {product.sku.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
                      <span className="badge bg-gray-100 text-gray-600">{product.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      SKU: {product.sku} &middot; Price: {formatCurrency(product.unitPrice)} &middot; Stock: {totalStock} units
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{product.documents.length} docs</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-4 space-y-4">
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}

                    {/* Inventory Locations */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Inventory Locations</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.inventory.map((inv) => (
                          <div key={inv.location} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                            <span className="text-sm text-gray-700">{inv.location}</span>
                            <span className={cn("font-semibold text-sm", inv.quantity < 10 ? "text-red-600" : "text-gray-900")}>{inv.quantity} units</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents & Assets</h4>
                      {product.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {product.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
                              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                <span className={cn("badge text-[10px]", docTypeColors[doc.type] || docTypeColors.other)}>
                                  {docTypeLabels[doc.type] || doc.type}
                                </span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No documents uploaded yet</p>
                      )}
                    </div>

                    {/* Pricing Details */}
                    <div className="flex gap-6 pt-2 border-t border-gray-50">
                      <div>
                        <span className="text-xs text-gray-500">Unit Price</span>
                        <p className="text-sm font-semibold">{formatCurrency(product.unitPrice)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Cost Price</span>
                        <p className="text-sm font-semibold">{formatCurrency(product.costPrice)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Margin</span>
                        <p className="text-sm font-semibold text-green-600">
                          {product.unitPrice > 0
                            ? `${(((product.unitPrice - product.costPrice) / product.unitPrice) * 100).toFixed(1)}%`
                            : "N/A"}
                        </p>
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
