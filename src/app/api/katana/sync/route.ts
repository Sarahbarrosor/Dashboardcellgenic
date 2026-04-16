import { NextRequest, NextResponse } from "next/server";
import {
  fullSync,
  syncLocations,
  syncProducts,
  syncInventory,
  syncSalesOrders,
  KatanaAPIError,
} from "@/lib/katana";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope") || "all";

    let result;
    switch (scope) {
      case "locations":
        result = { locations: await syncLocations() };
        break;
      case "products":
        result = { products: await syncProducts() };
        break;
      case "inventory":
        result = { inventory: await syncInventory() };
        break;
      case "sales_orders":
        result = { salesOrders: await syncSalesOrders() };
        break;
      case "all":
      default:
        result = await fullSync();
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Katana sync error:", error);
    const message = error instanceof KatanaAPIError ? error.message : String(error);
    const status = error instanceof KatanaAPIError ? (error.status || 500) : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
