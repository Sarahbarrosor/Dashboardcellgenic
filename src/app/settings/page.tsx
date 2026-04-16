"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Link2,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  ExternalLink,
  Shield,
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

const integrationInfo: Record<string, { name: string; description: string; logo: string; docs: string }> = {
  katana: {
    name: "Katana MRP",
    description: "Manufacturing resource planning - sync inventory, production, and sales orders in real-time.",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { apiKey: string; baseUrl: string; isActive: boolean }>>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setIntegrations(data.integrations);
        const values: Record<string, { apiKey: string; baseUrl: string; isActive: boolean }> = {};
        for (const provider of ["katana", "quickbooks"]) {
          const config = data.integrations.find((i: IntegrationConfig) => i.provider === provider);
          values[provider] = {
            apiKey: config?.apiKey || "",
            baseUrl: config?.baseUrl || "",
            isActive: config?.isActive || false,
          };
        }
        setEditValues(values);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveIntegration = async (provider: string) => {
    setSaving(provider);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, ...editValues[provider] }),
      });
      // Refresh
      const res = await fetch("/api/settings");
      const data = await res.json();
      setIntegrations(data.integrations);
    } catch (error) {
      console.error("Failed to save:", error);
    }
    setSaving(null);
  };

  if (loading) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Integration Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Integrations</h3>
        <p className="text-sm text-gray-500 mb-4">
          Connect your external systems to sync data automatically.
        </p>

        <div className="space-y-4">
          {Object.entries(integrationInfo).map(([provider, info]) => {
            const config = integrations.find((i) => i.provider === provider);
            const values = editValues[provider] || { apiKey: "", baseUrl: "", isActive: false };

            return (
              <div key={provider} className="card">
                <div className="card-body">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-bold text-sm flex-shrink-0">
                      {info.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{info.name}</h4>
                        {values.isActive ? (
                          <span className="flex items-center gap-1 badge bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" /> Connected
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 badge bg-gray-100 text-gray-500">
                            <XCircle className="h-3 w-3" /> Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{info.description}</p>
                      {config?.lastSyncAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Last synced: {formatDateTime(config.lastSyncAt)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="label">API Key</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="password"
                          value={values.apiKey}
                          onChange={(e) => setEditValues({ ...editValues, [provider]: { ...values, apiKey: e.target.value } })}
                          className="input pl-10"
                          placeholder="Enter API key..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Base URL</label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={values.baseUrl}
                          onChange={(e) => setEditValues({ ...editValues, [provider]: { ...values, baseUrl: e.target.value } })}
                          className="input pl-10"
                          placeholder="https://api.example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={values.isActive}
                        onChange={(e) => setEditValues({ ...editValues, [provider]: { ...values, isActive: e.target.checked } })}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-700">Enable integration</span>
                    </label>
                    <div className="flex gap-2">
                      <a
                        href={info.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Docs
                      </a>
                      <button
                        onClick={() => saveIntegration(provider)}
                        disabled={saving === provider}
                        className="btn-primary text-xs"
                      >
                        {saving === provider ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
          <div>
            <label className="label">Low Stock Alert Threshold (Global Default)</label>
            <input type="number" defaultValue={10} className="input max-w-sm" />
            <p className="text-xs text-gray-400 mt-1">This can be overridden per product in inventory settings.</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">Enable daily stock alert notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-sm text-gray-700">Enable task deadline reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
}
