"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  FileText,
  Package,
  CreditCard,
  Truck,
  ClipboardCheck,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Médicos", href: "/medicos", icon: UserCheck },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Solicitudes", href: "/solicitudes", icon: FileText },
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Pagos", href: "/pagos", icon: CreditCard },
  { name: "Fulfillment", href: "/fulfillment", icon: Truck },
  { name: "Evidencia", href: "/evidencia", icon: ClipboardCheck },
  { name: "Alertas", href: "/alertas", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          CG
        </div>
        <div>
          <h1 className="text-sm font-bold text-white">Cellgenic</h1>
          <p className="text-xs text-gray-400">Argentina</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto lg:hidden text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600/20 text-brand-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold">
            SB
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">Sarah Barros</p>
            <p className="text-xs text-gray-400 truncate">Admin Cellgenic</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden rounded-lg bg-gray-900 p-2 text-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-gray-900 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      <aside className="hidden lg:flex w-[260px] flex-col bg-gray-900 flex-shrink-0">
        {navContent}
      </aside>
    </>
  );
}
