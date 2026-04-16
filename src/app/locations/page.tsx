"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Phone,
  Mail,
  User,
  Package,
  ArrowUp,
  ArrowDown,
  Building2,
  Warehouse,
  Store,
  X,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  code: string | null;
  type: string;
  address: string | null;
  city: string | null;
  country: string | null;
  managerName: string | null;
  managerEmail: string | null;
  phone: string | null;
  isActive: boolean;
  inventory: { totalItems: number; productCount: number };
  activeOutgoing: number;
  activeIncoming: number;
}

const typeIcons: Record<string, typeof Warehouse> = {
  warehouse: Warehouse,
  distribution: Building2,
  retail: Store,
  depot: Package,
  office: Building2,
};

const typeLabels: Record<string, string> = {
  warehouse: "Warehouse",
  distribution: "Distribution Center",
  retail: "Retail Store",
  depot: "Depot",
  office: "Office",
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: "", code: "", type: "warehouse", address: "", city: "", country: "USA",
    managerName: "", managerEmail: "", phone: "",
  });

  const fetchData = () => {
    setLoading(true);
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => setLocations(data.locations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const createLocation = async () => {
    if (!newLocation.name) return;
    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLocation),
    });
    setShowNewForm(false);
    setNewLocation({ name: "", code: "", type: "warehouse", address: "", city: "", country: "USA", managerName: "", managerEmail: "", phone: "" });
    fetchData();
  };

  if (loading) return <LoadingSpinner className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{locations.length} active locations across your network</p>
        <button onClick={() => setShowNewForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Location
        </button>
      </div>

      {showNewForm && (
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">New Location</h3>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Name *</label>
              <input type="text" value={newLocation.name} onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })} className="input" placeholder="New Warehouse" />
            </div>
            <div>
              <label className="label">Code</label>
              <input type="text" value={newLocation.code} onChange={(e) => setNewLocation({ ...newLocation, code: e.target.value.toUpperCase() })} className="input" placeholder="NEW" maxLength={5} />
            </div>
            <div>
              <label className="label">Type</label>
              <select value={newLocation.type} onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })} className="select">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Address</label>
              <input type="text" value={newLocation.address} onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">City</label>
              <input type="text" value={newLocation.city} onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Country</label>
              <input type="text" value={newLocation.country} onChange={(e) => setNewLocation({ ...newLocation, country: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Manager Name</label>
              <input type="text" value={newLocation.managerName} onChange={(e) => setNewLocation({ ...newLocation, managerName: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Manager Email</label>
              <input type="email" value={newLocation.managerEmail} onChange={(e) => setNewLocation({ ...newLocation, managerEmail: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" value={newLocation.phone} onChange={(e) => setNewLocation({ ...newLocation, phone: e.target.value })} className="input" />
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button onClick={() => setShowNewForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={createLocation} className="btn-primary">Add Location</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const Icon = typeIcons[loc.type] || Warehouse;
          return (
            <div key={loc.id} className="card card-body">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-600 flex-shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-gray-900">{loc.name}</h3>
                    {loc.code && <span className="badge bg-gray-100 text-gray-600 font-mono text-[10px]">{loc.code}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{typeLabels[loc.type]} {loc.city && `· ${loc.city}`}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 mb-4">
                {loc.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{loc.address}{loc.city && `, ${loc.city}`}{loc.country && `, ${loc.country}`}</span>
                  </div>
                )}
                {loc.managerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{loc.managerName}</span>
                  </div>
                )}
                {loc.managerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{loc.managerEmail}</span>
                  </div>
                )}
                {loc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span>{loc.phone}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{loc.inventory.totalItems}</p>
                  <p className="text-[10px] text-gray-400 uppercase">Units in Stock</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-600 flex items-center justify-center gap-1">
                    <ArrowUp className="h-4 w-4" /> {loc.activeOutgoing}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">Outgoing</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                    <ArrowDown className="h-4 w-4" /> {loc.activeIncoming}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">Incoming</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
