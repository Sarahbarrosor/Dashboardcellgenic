import { prisma } from "./db";

const KATANA_BASE_URL = process.env.KATANA_BASE_URL || "https://api.katanamrp.com/v1";

export interface KatanaProduct {
  id: number;
  name: string;
  uom: string;
  category_name: string | null;
  is_producible: boolean;
  is_purchasable: boolean;
  is_sellable: boolean;
  default_supplier_id: number | null;
  additional_info: string | null;
  batch_tracked: boolean;
  serial_tracked: boolean;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  variants?: KatanaVariant[];
}

export interface KatanaVariant {
  id: number;
  product_id: number;
  sku: string;
  sales_price: number | null;
  purchase_price: number | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface KatanaInventoryItem {
  variant_id: number;
  location_id: number;
  quantity_in_stock: number;
  quantity_committed: number;
  quantity_expected: number;
  quantity_missing_or_excess: number;
  value_in_stock: number;
  average_cost: number;
  reorder_point: number | null;
  minimum_order_quantity: number | null;
}

export interface KatanaLocation {
  id: number;
  name: string;
  address: string | null;
  is_primary: boolean;
  sales_allowed: boolean;
  purchase_allowed: boolean;
  manufacturing_allowed: boolean;
  created_at: string;
  updated_at: string;
}

export interface KatanaSalesOrder {
  id: number;
  order_no: string;
  customer_id: number | null;
  status: string;
  currency: string;
  total: number;
  invoicing_status: string | null;
  delivery_date: string | null;
  order_created_date: string;
  created_at: string;
  updated_at: string;
  sales_order_rows?: {
    id: number;
    variant_id: number;
    quantity: number;
    price_per_unit: number;
    total: number;
  }[];
}

export class KatanaAPIError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = "KatanaAPIError";
  }
}

async function getApiKey(): Promise<string> {
  // Priority: environment variable, then database config
  if (process.env.KATANA_API_KEY) return process.env.KATANA_API_KEY;
  const config = await prisma.integrationConfig.findUnique({ where: { provider: "katana" } });
  if (!config?.apiKey) {
    throw new KatanaAPIError(
      "Katana API key not configured. Set KATANA_API_KEY env var or configure in Settings."
    );
  }
  return config.apiKey;
}

async function katanaFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = await getApiKey();
  const url = endpoint.startsWith("http") ? endpoint : `${KATANA_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try { body = await response.json(); } catch { body = await response.text(); }
    throw new KatanaAPIError(
      `Katana API error: ${response.status} ${response.statusText}`,
      response.status,
      body
    );
  }

  return response.json() as Promise<T>;
}

// ─── API Operations ──────────────────────────────────────────────

export async function fetchProducts(limit = 250): Promise<KatanaProduct[]> {
  const result = await katanaFetch<{ data: KatanaProduct[] }>(`/products?limit=${limit}`);
  return result.data || [];
}

export async function fetchVariants(limit = 250): Promise<KatanaVariant[]> {
  const result = await katanaFetch<{ data: KatanaVariant[] }>(`/variants?limit=${limit}`);
  return result.data || [];
}

export async function fetchInventory(limit = 250): Promise<KatanaInventoryItem[]> {
  const result = await katanaFetch<{ data: KatanaInventoryItem[] }>(`/inventory?limit=${limit}`);
  return result.data || [];
}

export async function fetchLocations(): Promise<KatanaLocation[]> {
  const result = await katanaFetch<{ data: KatanaLocation[] }>(`/locations`);
  return result.data || [];
}

export async function fetchSalesOrders(limit = 100): Promise<KatanaSalesOrder[]> {
  const result = await katanaFetch<{ data: KatanaSalesOrder[] }>(
    `/sales_orders?limit=${limit}&extend=sales_order_rows`
  );
  return result.data || [];
}

export async function testConnection(): Promise<{ ok: boolean; message: string; locations?: number }> {
  try {
    const locations = await fetchLocations();
    return {
      ok: true,
      message: `Connected successfully. Found ${locations.length} locations in Katana.`,
      locations: locations.length,
    };
  } catch (error) {
    if (error instanceof KatanaAPIError) {
      return { ok: false, message: error.message };
    }
    return { ok: false, message: String(error) };
  }
}

// ─── Sync Operations ─────────────────────────────────────────────

export async function syncLocations(): Promise<{ created: number; updated: number }> {
  const katanaLocations = await fetchLocations();
  let created = 0, updated = 0;

  for (const kl of katanaLocations) {
    const existing = await prisma.location.findFirst({
      where: { name: kl.name },
    });

    const locationType = kl.manufacturing_allowed
      ? "warehouse"
      : kl.sales_allowed
        ? "retail"
        : "distribution";

    if (existing) {
      await prisma.location.update({
        where: { id: existing.id },
        data: {
          address: kl.address,
          type: locationType,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.location.create({
        data: {
          name: kl.name,
          code: kl.name.slice(0, 3).toUpperCase(),
          address: kl.address,
          type: locationType,
          isActive: true,
        },
      });
      created++;
    }
  }

  return { created, updated };
}

export async function syncProducts(): Promise<{ created: number; updated: number }> {
  const [products, variants] = await Promise.all([fetchProducts(), fetchVariants()]);
  const variantsByProductId = new Map<number, KatanaVariant[]>();
  for (const v of variants) {
    const arr = variantsByProductId.get(v.product_id) || [];
    arr.push(v);
    variantsByProductId.set(v.product_id, arr);
  }

  let created = 0, updated = 0;

  for (const kp of products) {
    if (kp.archived_at) continue;
    const productVariants = variantsByProductId.get(kp.id) || [];
    // Use first variant as canonical SKU/price; products without variants get placeholder
    const primary = productVariants[0];
    const sku = primary?.sku || `KATANA-${kp.id}`;
    const unitPrice = primary?.sales_price || 0;
    const costPrice = primary?.purchase_price || 0;

    const existing = await prisma.product.findFirst({
      where: { OR: [{ katanaId: String(kp.id) }, { sku }] },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          katanaId: String(kp.id),
          name: kp.name,
          category: kp.category_name || existing.category || "Uncategorized",
          unitPrice: unitPrice || existing.unitPrice,
          costPrice: costPrice || existing.costPrice,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          katanaId: String(kp.id),
          sku,
          name: kp.name,
          description: kp.additional_info,
          category: kp.category_name || "Uncategorized",
          unitPrice,
          costPrice,
          isActive: true,
        },
      });
      created++;
    }
  }

  return { created, updated };
}

export async function syncInventory(syncId?: string): Promise<{ synced: number; skipped: number; changed: number }> {
  const [inventory, katanaLocations, variants] = await Promise.all([
    fetchInventory(),
    fetchLocations(),
    fetchVariants(),
  ]);

  const locationMap = new Map(katanaLocations.map((l) => [l.id, l.name]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  let synced = 0, skipped = 0, changed = 0;

  for (const item of inventory) {
    const locationName = locationMap.get(item.location_id);
    const variant = variantMap.get(item.variant_id);

    if (!locationName || !variant) {
      skipped++;
      continue;
    }

    const product = await prisma.product.findFirst({
      where: { OR: [{ sku: variant.sku }, { katanaId: String(variant.product_id) }] },
    });
    if (!product) {
      skipped++;
      continue;
    }

    const newQty = Math.floor(item.quantity_in_stock);

    const existing = await prisma.inventory.findUnique({
      where: { productId_location: { productId: product.id, location: locationName } },
    });

    const previousQty = existing?.quantity ?? 0;

    await prisma.inventory.upsert({
      where: { productId_location: { productId: product.id, location: locationName } },
      update: {
        quantity: newQty,
        reorderPoint: item.reorder_point || undefined,
        reorderQuantity: item.minimum_order_quantity || undefined,
      },
      create: {
        productId: product.id,
        location: locationName,
        quantity: newQty,
        minimumThreshold: 10,
        reorderPoint: item.reorder_point || 20,
        reorderQuantity: item.minimum_order_quantity || 50,
      },
    });

    if (previousQty !== newQty) {
      await prisma.inventoryHistory.create({
        data: {
          productId: product.id,
          location: locationName,
          previousQty,
          newQty,
          changeQty: newQty - previousQty,
          changeType: "sync",
          source: "katana",
          syncId,
          notes: `Katana sync: ${previousQty} → ${newQty}`,
        },
      });
      changed++;
    }

    synced++;
  }

  return { synced, skipped, changed };
}

export async function syncSalesOrders(): Promise<{ created: number; updated: number; salesRecords: number }> {
  const [salesOrders, variants] = await Promise.all([fetchSalesOrders(), fetchVariants()]);
  const variantMap = new Map(variants.map((v) => [v.id, v]));
  let created = 0, updated = 0, salesRecords = 0;

  const systemUser = await prisma.user.findFirst();
  if (!systemUser) throw new Error("No system user found");

  for (const ko of salesOrders) {
    const existing = await prisma.order.findFirst({ where: { katanaOrderId: String(ko.id) } });

    const orderItems = [];
    for (const row of ko.sales_order_rows || []) {
      const variant = variantMap.get(row.variant_id);
      if (!variant) continue;
      const product = await prisma.product.findFirst({ where: { sku: variant.sku } });
      if (!product) continue;
      orderItems.push({
        productId: product.id,
        quantity: row.quantity,
        unitPrice: row.price_per_unit,
        total: row.total,
      });

      // Also log a sales record for completed orders
      if (ko.status === "DELIVERED" || ko.invoicing_status === "INVOICED") {
        await prisma.saleRecord.create({
          data: {
            productId: product.id,
            quantity: row.quantity,
            unitPrice: row.price_per_unit,
            totalAmount: row.total,
            channel: "direct",
            saleDate: new Date(ko.order_created_date),
          },
        });
        salesRecords++;
      }
    }

    const statusMap: Record<string, string> = {
      NOT_SHIPPED: "pending",
      PARTIALLY_SHIPPED: "processing",
      SHIPPED: "shipped",
      DELIVERED: "delivered",
      CANCELLED: "cancelled",
    };
    const mappedStatus = statusMap[ko.status] || "pending";

    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: { status: mappedStatus, totalAmount: ko.total },
      });
      updated++;
    } else {
      await prisma.order.create({
        data: {
          orderNumber: ko.order_no,
          type: "sales",
          status: mappedStatus,
          totalAmount: ko.total,
          katanaOrderId: String(ko.id),
          createdById: systemUser.id,
          createdAt: new Date(ko.created_at),
          items: orderItems.length > 0 ? { create: orderItems } : undefined,
        },
      });
      created++;
    }
  }

  return { created, updated, salesRecords };
}

export async function fullSync(trigger: string = "manual"): Promise<{
  locations: Awaited<ReturnType<typeof syncLocations>>;
  products: Awaited<ReturnType<typeof syncProducts>>;
  inventory: Awaited<ReturnType<typeof syncInventory>>;
  salesOrders: Awaited<ReturnType<typeof syncSalesOrders>>;
  syncedAt: string;
  syncLogId: string;
}> {
  const syncLog = await prisma.syncLog.create({
    data: { scope: "all", status: "running", trigger },
  });

  try {
    const locations = await syncLocations();
    const products = await syncProducts();
    const inventory = await syncInventory(syncLog.id);
    const salesOrders = await syncSalesOrders();

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        locationsCreated: locations.created,
        locationsUpdated: locations.updated,
        productsCreated: products.created,
        productsUpdated: products.updated,
        inventorySynced: inventory.synced,
        inventoryChanged: inventory.changed,
        ordersCreated: salesOrders.created,
        ordersUpdated: salesOrders.updated,
      },
    });

    await prisma.integrationConfig.update({
      where: { provider: "katana" },
      data: { lastSyncAt: new Date(), isActive: true },
    }).catch(() => {
      return prisma.integrationConfig.create({
        data: {
          provider: "katana",
          lastSyncAt: new Date(),
          isActive: true,
          baseUrl: KATANA_BASE_URL,
        },
      });
    });

    return {
      locations,
      products,
      inventory,
      salesOrders,
      syncedAt: new Date().toISOString(),
      syncLogId: syncLog.id,
    };
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
