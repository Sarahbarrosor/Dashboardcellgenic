"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  AlertCircle,
  Database,
  Package,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn, formatDateTime } from "@/lib/utils";

interface IntegrationConfig {
  id: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  baseUrl: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  settings: string | null;
}

interface KatanaStatus {
  configured: boolean;
  hasEnvKey: boolean;
  isActive: boolean;
  lastSyncAt: string | null;
  baseUrl: string;
}

const integrationInfo: Record<string, { name: string; description: string; logo: string; docs: string }> = {
  katana: {
    name: "Katana MRP",
    description: "Manufacturing resource planning - sync inventory, products, locations, and sales orders in real-time.",
    logo: "K",
    docs: "https://developer.katanamrp.com/",
  },
  quickbooks: {
    name: "QuickBooks Online",
    description: "Accounting & invoicing - sync financial data, invoices, and payment records.",
    logo: "QB",
    docs: "https://developer.intuit.com/",
  },
};

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [katanaStatus, setKatanaStatus] = useState<KatanaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { apiKey: string; baseUrl: string; isActive: boolean }>>({});

  const loadData = async () => {
    setLoading(true);
    const [settingsRes, katanaRes] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/katana/status").then((r) => r.json()),
    ]);

    setIntegrations(settingsRes.integrations);
    setKatanaStatus(katanaRes);

    const values: Record<string, { apiKey: string; baseUrl: string; isActive: boolean }> = {};
    for (const provider of ["katana", "quickbooks"]) {
      const config = settingsRes.integrations.find((i: IntegrationConfig) => i.provider === provider);
      values[provider] = {
        apiKey: config?.apiKey || "",
        baseUrl: config?.baseUrl || (provider === "katana" ? "https://api.katanamrp.com/v1" : ""),
        isActive: config?.isActive || false,
      };
    }
    setEditValues(values);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const saveIntegration = async (provider: string) => {
    setSaving(provider);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...editValues[provider] }),
      });
      await loadData();
    } catch (error) {
      console.error("Failed to save:", error);
    }
    setSaving(null);
  };

  const testKatanaConnection = async () => {
    setTesting(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/katana/test", { method: "POST" });
      const data = await res.json();
      setSyncResult({
        ok: data.ok,
        message: data.ok ? "Connection successful!" : "Connection failed",
        detail: data.message,
      });
    } catch (error) {
      setSyncResult({
        ok: false,
        message: "Connection failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    setTesting(false);
  };

  const runSync = async (scope: string) => {
    setSyncing(scope);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/katana/sync?scope=${scope}`, { method: "POST" });
      const data = await res.json();

      if (data.ok) {
        const parts = [];
        if (data.locations) parts.push(`Locations: ${data.locations.created} created, ${data.locations.updated} updated`);
        if (data.products) parts.push(`Products: ${data.products.created} created, ${data.products.updated} updated`);
        if (data.inventory) parts.push(`Inventory: ${data.inventory.synced} synced, ${data.inventory.skipped} skipped`);
        if (data.salesOrders) parts.push(`Sales Orders: ${data.salesOrders.created} created, ${data.salesOrders.updated} updated, ${data.salesOrders.salesRecords} sales records`);

        setSyncResult({
          ok: true,
          message: "Sync completed successfully!",
          detail: parts.join(" · "),
        });
      } else {
        setSyncResult({ ok: false, message: "Sync failed", detail: data.error });
      }
      await loadData();
    } catch (error) {
      setSyncResult({
        ok: false,
        message: "Sync failed",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    setSyncing(null);
  };

  if (loading) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Katana Integration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Katana MRP Integration</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sync your Katana data directly into the platform. Real-time bidirectional sync for products, inventory, and sales orders.
        </p>

        <div className="card">
          <div className="card-body">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-sm flex-shrink-0">
                K
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900">Katana MRP</h4>
                  {katanaStatus?.hasEnvKey ? (
                    <span className="flex items-center gap-1 badge bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" /> Configured via ENV
                    </span>
                  ) : katanaStatus?.configured ? (
                    <span className="flex items-center gap-1 badge bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" /> API Key Set
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 badge bg-gray-100 text-gray-500">
                      <XCircle className="h-3 w-3" /> Not Configured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sync products, inventory, locations, and sales orders with Katana MRP.
                </p>
                {katanaStatus?.lastSyncAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last synced: {formatDateTime(katanaStatus.lastSyncAt)}
                  </p>
                )}
              </div>
            </div>

            {katanaStatus?.hasEnvKey ? (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-4 text-sm text-blue-800">
                <p className="flex items-start gap-2">
                  <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Katana API key is configured via the <code className="font-mono bg-blue-100 px-1 rounded">KATANA_API_KEY</code> environment variable.
                    The app will use that key for all sync operations.
                  </span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label">API Key</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={editValues.katana?.apiKey || ""}
                      onChange={(e) => setEditValues({ ...editValues, katana: { ...editValues.katana, apiKey: e.target.value } })}
                      className="input pl-10"
                      placeholder="Paste your Katana API key..."
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    For production, set <code className="font-mono bg-gray-100 px-1 rounded">KATANA_API_KEY</code> env var instead.
                  </p>
                </div>
                <div>
                  <label className="label">Base URL</label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={editValues.katana?.baseUrl || ""}
                      onChange={(e) => setEditValues({ ...editValues, katana: { ...editValues.katana, baseUrl: e.target.value } })}
                      className="input pl-10"
                      placeholder="https://api.katanamrp.com/v1"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button onClick={testKatanaConnection} disabled={testing || !katanaStatus?.configured} className="btn-secondary text-xs">
                {testing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Test Connection
              </button>
              {!katanaStatus?.hasEnvKey && (
                <button onClick={() => saveIntegration("katana")} disabled={saving === "katana"} className="btn-secondary text-xs">
                  {saving === "katana" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Key
                </button>
              )}
              <a href={integrationInfo.katana.docs} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs ml-auto">
                <ExternalLink className="h-3.5 w-3.5" /> API Docs
              </a>
            </div>

            {/* Sync Actions */}
            <div className="border-t border-gray-100 pt-4">
              <h5 className="text-xs font-semibold text-gray-500 uppercase mb-3">Sync Operations</h5>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <button onClick={() => runSync("locations")} disabled={!!syncing || !katanaStatus?.configured} className="btn-secondary text-xs">
                  {syncing === "locations" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                  Locations
                </button>
                <button onClick={() => runSync("products")} disabled={!!syncing || !katanaStatus?.configured} className="btn-secondary text-xs">
                  {syncing === "products" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                  Products
                </button>
                <button onClick={() => runSync("inventory")} disabled={!!syncing || !katanaStatus?.configured} className="btn-secondary text-xs">
                  {syncing === "inventory" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                  Inventory
                </button>
                <button onClick={() => runSync("sales_orders")} disabled={!!syncing || !katanaStatus?.configured} className="btn-secondary text-xs">
                  {syncing === "sales_orders" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                  Sales Orders
                </button>
                <button onClick={() => runSync("all")} disabled={!!syncing || !katanaStatus?.configured} className="btn-primary text-xs">
                  {syncing === "all" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Full Sync
                </button>
              </div>
            </div>

            {syncResult && (
              <div className={cn("mt-4 rounded-lg border p-3 flex items-start gap-2 text-sm", syncResult.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800")}>
                {syncResult.ok ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="font-semibold">{syncResult.message}</p>
                  {syncResult.detail && <p className="text-xs mt-1 opacity-90">{syncResult.detail}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QuickBooks Integration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Other Integrations</h3>
        <div className="card">
          <div className="card-body">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-sm flex-shrink-0">
                QB
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{integrationInfo.quickbooks.name}</h4>
                  {editValues.quickbooks?.isActive ? (
                    <span className="flex items-center gap-1 badge bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Connected</span>
                  ) : (
                    <span className="flex items-center gap-1 badge bg-gray-100 text-gray-500"><XCircle className="h-3 w-3" /> Disconnected</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{integrationInfo.quickbooks.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">API Key</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={editValues.quickbooks?.apiKey || ""}
                    onChange={(e) => setEditValues({ ...editValues, quickbooks: { ...editValues.quickbooks, apiKey: e.target.value } })}
                    className="input pl-10"
                    placeholder="Enter API key..."
                  />
                </div>
              </div>
              <div>
                <label className="label">Base URL</label>
                <input
                  type="text"
                  value={editValues.quickbooks?.baseUrl || ""}
                  onChange={(e) => setEditValues({ ...editValues, quickbooks: { ...editValues.quickbooks, baseUrl: e.target.value } })}
                  className="input"
                  placeholder="https://quickbooks.api.intuit.com/v3"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editValues.quickbooks?.isActive || false}
                  onChange={(e) => setEditValues({ ...editValues, quickbooks: { ...editValues.quickbooks, isActive: e.target.checked } })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700">Enable integration</span>
              </label>
              <button onClick={() => saveIntegration("quickbooks")} disabled={saving === "quickbooks"} className="btn-primary text-xs">
                {saving === "quickbooks" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-900">General Settings</h3>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="label">Company Name</label>
            <input type="text" defaultValue="Cellgenic" className="input max-w-sm" />
          </div>
          <div>
            <label className="label">Default Currency</label>
            <select defaultValue="USD" className="select max-w-sm">
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">Enable daily stock alert notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">Enable task deadline reminders</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">Alert on incoming location transfers</span>
          </div>
        </div>
      </div>
    </div>
  );
}
