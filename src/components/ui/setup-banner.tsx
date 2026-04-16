"use client";

import { useEffect, useState } from "react";
import { Database, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStatus {
  schemaReady: boolean;
  seeded: boolean;
  error?: string;
}

export function SetupBanner() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string>("");

  const check = async () => {
    try {
      const res = await fetch("/api/setup");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setStatus({ schemaReady: false, seeded: false, error: String(err) });
    }
  };

  useEffect(() => { check(); }, []);

  const runSetup = async () => {
    setRunning(true);
    setMessage("");
    try {
      const res = await fetch("/api/setup", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Database initialized! Created ${data.created?.users || 0} users, ${data.created?.products || 0} products, ${data.created?.locations || 0} locations.`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`Setup failed: ${data.error || "unknown error"}`);
      }
      await check();
    } catch (err) {
      setMessage(`Setup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    setRunning(false);
  };

  if (!status) return null;
  if (status.schemaReady && status.seeded) return null;

  return (
    <div className={cn(
      "card card-body border-l-4 mb-6",
      status.error ? "border-l-red-500 bg-red-50" : "border-l-yellow-500 bg-yellow-50"
    )}>
      <div className="flex items-start gap-3">
        {status.error ? (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        ) : (
          <Database className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">
            {status.error
              ? "Database connection error"
              : !status.schemaReady
                ? "Database tables not yet created"
                : "Database is empty — seed demo data to get started"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {status.error ? (
              <>
                Check that <code className="text-xs bg-white px-1 rounded border">DATABASE_URL</code> and{" "}
                <code className="text-xs bg-white px-1 rounded border">DIRECT_URL</code> are set in Vercel
                environment variables. Error: <code className="text-xs text-red-700">{status.error}</code>
              </>
            ) : !status.schemaReady ? (
              <>
                Tables will be created automatically. If this message persists after a redeploy,
                click the button below to initialize manually.
              </>
            ) : (
              <>
                Click the button below to populate with demo products, inventory, locations, and sample transfers.
              </>
            )}
          </p>

          {message && (
            <p className="text-sm text-gray-700 mt-2 p-2 rounded bg-white border border-gray-200">
              {message}
            </p>
          )}

          <button
            onClick={runSetup}
            disabled={running}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 disabled:opacity-50"
          >
            {running ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Initializing...</>
            ) : status.schemaReady ? (
              <><Database className="h-4 w-4" /> Seed Demo Data</>
            ) : (
              <><CheckCircle className="h-4 w-4" /> Initialize Database</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
