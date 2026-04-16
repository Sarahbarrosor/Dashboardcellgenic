"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/inventory": "Inventory Management",
  "/products": "Product Database",
  "/transfers": "Location Transfers",
  "/locations": "Locations",
  "/sales": "Sales & Insights",
  "/tasks": "Task Management",
  "/orders": "Order Management",
  "/alerts": "Alerts Center",
  "/settings": "Settings & Integrations",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Cellgenic Operations";

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none w-48"
          />
        </div>

        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </button>
      </div>
    </header>
  );
}
