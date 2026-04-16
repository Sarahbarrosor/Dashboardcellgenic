import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAllTables } from "@/lib/create-tables";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Check setup status
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      schemaReady: true,
      seeded: userCount > 0,
      counts: { users: userCount },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") || msg.includes("P2021") || msg.includes("relation")) {
      return NextResponse.json({ schemaReady: false, seeded: false });
    }
    return NextResponse.json({ schemaReady: false, seeded: false, error: msg });
  }
}

// Run full setup: create tables via raw SQL + seed demo data
export async function POST() {
  try {
    // Check if tables exist; if not, create them with raw SQL
    let schemaReady = false;
    try {
      await prisma.user.count();
      schemaReady = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("does not exist") || msg.includes("P2021") || msg.includes("relation")) {
        try {
          console.log("Tables not found — creating via raw SQL...");
          const result = await createAllTables();
          console.log("Tables created successfully:", result);
          schemaReady = true;
        } catch (sqlErr) {
          console.error("Raw SQL table creation failed:", sqlErr);
          return NextResponse.json({
            ok: false,
            error: `Could not create tables: ${sqlErr instanceof Error ? sqlErr.message : String(sqlErr)}`,
          }, { status: 500 });
        }
      } else {
        throw err;
      }
    }

    if (!schemaReady) {
      return NextResponse.json({ ok: false, error: "Database schema could not be verified." }, { status: 500 });
    }

    // If already seeded, skip
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({
        ok: true,
        alreadySeeded: true,
        message: "Database already contains data. Seed skipped.",
      });
    }

    // ─── Seed ─────────────────────────────────────────────
    const locationData = [
      { name: "Main Warehouse", code: "MWH", type: "warehouse", address: "1500 Industrial Blvd", city: "Los Angeles", managerName: "David Chen", managerEmail: "david@cellgenic.com", phone: "(310) 555-0101" },
      { name: "Distribution Center", code: "DIS", type: "distribution", address: "400 Logistics Way", city: "Chicago", managerName: "Maria Santos", managerEmail: "maria@cellgenic.com", phone: "(312) 555-0102" },
      { name: "East Coast Hub", code: "EAS", type: "warehouse", address: "88 Harbor Dr", city: "Newark", managerName: "James Wilson", managerEmail: "james@cellgenic.com", phone: "(973) 555-0103" },
      { name: "West Coast Hub", code: "WES", type: "warehouse", address: "2200 Pacific Coast Hwy", city: "Long Beach", managerName: "Ana Rodriguez", managerEmail: "ana@cellgenic.com", phone: "(562) 555-0104" },
      { name: "Retail Store", code: "RET", type: "retail", address: "42 Main Street", city: "San Diego", managerName: "Sarah Barros", managerEmail: "sarah@cellgenic.com", phone: "(619) 555-0105" },
      { name: "International Depot", code: "INT", type: "depot", address: "Port Complex, Terminal 4", city: "Miami", managerName: "Carlos Pereira", managerEmail: "carlos@cellgenic.com", phone: "(305) 555-0106" },
    ];

    const locations = await Promise.all(
      locationData.map((loc) => prisma.location.create({ data: loc }))
    );
    const locMap = Object.fromEntries(locations.map((l) => [l.name, l]));

    const users = await Promise.all([
      prisma.user.create({ data: { name: "Sarah Barros", email: "sarah@cellgenic.com", role: "admin", locationId: locMap["Retail Store"].id } }),
      prisma.user.create({ data: { name: "David Chen", email: "david@cellgenic.com", role: "manager", locationId: locMap["Main Warehouse"].id } }),
      prisma.user.create({ data: { name: "Maria Santos", email: "maria@cellgenic.com", role: "manager", locationId: locMap["Distribution Center"].id } }),
      prisma.user.create({ data: { name: "James Wilson", email: "james@cellgenic.com", role: "manager", locationId: locMap["East Coast Hub"].id } }),
      prisma.user.create({ data: { name: "Ana Rodriguez", email: "ana@cellgenic.com", role: "manager", locationId: locMap["West Coast Hub"].id } }),
      prisma.user.create({ data: { name: "Carlos Pereira", email: "carlos@cellgenic.com", role: "member", locationId: locMap["International Depot"].id } }),
    ]);

    const productData = [
      { sku: "CG-CBD-500", name: "CBD Oil Tincture 500mg", category: "CBD Oils", unitPrice: 49.99, costPrice: 18.50, description: "Full-spectrum CBD oil, 500mg, 30ml. Third-party tested." },
      { sku: "CG-CBD-1000", name: "CBD Oil Tincture 1000mg", category: "CBD Oils", unitPrice: 79.99, costPrice: 28.00, description: "Full-spectrum CBD oil, 1000mg, 30ml." },
      { sku: "CG-CBD-2000", name: "CBD Oil Tincture 2000mg", category: "CBD Oils", unitPrice: 129.99, costPrice: 42.00, description: "Full-spectrum CBD oil, 2000mg, 60ml." },
      { sku: "CG-CAP-30", name: "CBD Capsules 30ct", category: "Capsules", unitPrice: 39.99, costPrice: 14.00, description: "CBD capsules, 25mg each, 30 count." },
      { sku: "CG-CAP-60", name: "CBD Capsules 60ct", category: "Capsules", unitPrice: 69.99, costPrice: 24.00, description: "CBD capsules, 25mg each, 60 count." },
      { sku: "CG-TOP-100", name: "CBD Topical Cream 100mg", category: "Topicals", unitPrice: 34.99, costPrice: 12.00, description: "CBD topical cream, 100mg, 2oz." },
      { sku: "CG-TOP-250", name: "CBD Topical Cream 250mg", category: "Topicals", unitPrice: 54.99, costPrice: 19.50, description: "CBD topical cream, 250mg, 4oz." },
      { sku: "CG-GUM-30", name: "CBD Gummies 30ct", category: "Edibles", unitPrice: 29.99, costPrice: 10.00, description: "CBD gummies, 10mg each, 30 count." },
      { sku: "CG-GUM-60", name: "CBD Gummies 60ct", category: "Edibles", unitPrice: 49.99, costPrice: 17.50, description: "CBD gummies, 10mg each, 60 count." },
      { sku: "CG-PET-300", name: "Pet CBD Oil 300mg", category: "Pet Products", unitPrice: 39.99, costPrice: 14.00, description: "Pet CBD oil, 300mg, bacon flavor." },
      { sku: "CG-SLP-500", name: "CBD Sleep Formula 500mg", category: "CBD Oils", unitPrice: 59.99, costPrice: 22.00, description: "CBD + melatonin for sleep." },
      { sku: "CG-RLX-500", name: "CBD Relaxation Blend 500mg", category: "CBD Oils", unitPrice: 54.99, costPrice: 20.00, description: "CBD with chamomile & passionflower." },
      { sku: "CG-ISO-1000", name: "CBD Isolate Powder 1000mg", category: "Isolates", unitPrice: 44.99, costPrice: 15.00, description: "Pure CBD isolate, 99%+ purity." },
      { sku: "CG-BAL-50", name: "CBD Muscle Balm 50ml", category: "Topicals", unitPrice: 44.99, costPrice: 16.00, description: "Concentrated CBD muscle balm." },
      { sku: "CG-BRD-750", name: "Broad Spectrum CBD 750mg", category: "CBD Oils", unitPrice: 64.99, costPrice: 24.00, description: "Broad spectrum CBD, THC-free." },
    ];

    const products = await Promise.all(
      productData.map((p) => prisma.product.create({ data: p }))
    );
    const prodBySku = Object.fromEntries(products.map((p) => [p.sku, p]));

    // Inventory per location
    const baseByType: Record<string, number> = { warehouse: 100, distribution: 50, depot: 70, retail: 15, office: 0 };
    const invRecords = [];
    for (const p of products) {
      for (const l of locations) {
        const base = baseByType[l.type] ?? 30;
        const qty = Math.max(0, base - Math.floor(Math.random() * base * 0.8));
        invRecords.push(
          prisma.inventory.create({
            data: {
              productId: p.id,
              location: l.name,
              quantity: qty,
              minimumThreshold: l.type === "warehouse" ? 15 : l.type === "retail" ? 3 : 8,
              reorderPoint: l.type === "warehouse" ? 30 : 15,
              reorderQuantity: l.type === "warehouse" ? 100 : 50,
              lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            },
          })
        );
      }
    }
    await Promise.all(invRecords);

    // Sales records (90 days)
    const channels = ["direct", "online", "wholesale", "distributor"];
    const customers = ["Green Valley Health", "Wellness First", "Natural Remedies Co", "Pacific Health Store", "Mountain Top Organics", "Coastal Wellness"];
    const salesData = [];
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const numSales = Math.floor(Math.random() * 6) + 2;
      for (let i = 0; i < numSales; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const qty = Math.floor(Math.random() * 15) + 1;
        const channel = channels[Math.floor(Math.random() * channels.length)];
        const discount = channel === "wholesale" ? 0.85 : channel === "distributor" ? 0.75 : 1;
        const unitPrice = Math.round(product.unitPrice * discount * 100) / 100;
        salesData.push({
          productId: product.id,
          quantity: qty,
          unitPrice,
          totalAmount: Math.round(qty * unitPrice * 100) / 100,
          channel,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          saleDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000),
        });
      }
    }
    for (let i = 0; i < salesData.length; i += 50) {
      await Promise.all(salesData.slice(i, i + 50).map((s) => prisma.saleRecord.create({ data: s })));
    }

    // Sample transfers
    const transferScenarios: {
      from: string; to: string; status: string; priority: string; reason: string;
      tracking?: string; method?: string;
      requester: string; approver?: string; receiver?: string;
      items: { sku: string; qtyReq: number; qtyShip?: number; qtyRec?: number }[];
      daysAgo: number;
    }[] = [
      { from: "Main Warehouse", to: "Retail Store", status: "in_transit", priority: "high", reason: "Retail floor restock after weekend surge", tracking: "INT-TRK-88291", method: "internal_fleet", requester: "Sarah Barros", approver: "David Chen", items: [{ sku: "CG-CBD-500", qtyReq: 30, qtyShip: 30 }, { sku: "CG-GUM-30", qtyReq: 40, qtyShip: 40 }], daysAgo: 1 },
      { from: "Distribution Center", to: "East Coast Hub", status: "requested", priority: "urgent", reason: "Critically low before trade show", requester: "James Wilson", items: [{ sku: "CG-CBD-1000", qtyReq: 50 }, { sku: "CG-CBD-2000", qtyReq: 25 }], daysAgo: 0 },
      { from: "Main Warehouse", to: "West Coast Hub", status: "approved", priority: "normal", reason: "Weekly restock", requester: "Ana Rodriguez", approver: "David Chen", items: [{ sku: "CG-CAP-30", qtyReq: 60, qtyShip: 60 }, { sku: "CG-SLP-500", qtyReq: 25, qtyShip: 25 }], daysAgo: 1 },
      { from: "East Coast Hub", to: "International Depot", status: "in_transit", priority: "normal", reason: "Export to Mexico distributor", tracking: "FDX-4872-11", method: "courier", requester: "Carlos Pereira", approver: "James Wilson", items: [{ sku: "CG-ISO-1000", qtyReq: 20, qtyShip: 20 }, { sku: "CG-BAL-50", qtyReq: 15, qtyShip: 15 }], daysAgo: 2 },
      { from: "West Coast Hub", to: "Retail Store", status: "requested", priority: "high", reason: "Gummies & topicals urgently needed", requester: "Sarah Barros", items: [{ sku: "CG-GUM-60", qtyReq: 25 }, { sku: "CG-TOP-250", qtyReq: 12 }], daysAgo: 0 },
    ];

    const userByName = Object.fromEntries(users.map((u) => [u.name, u]));
    let trfCount = 0;
    for (const t of transferScenarios) {
      trfCount++;
      const now = Date.now();
      const requestedAt = new Date(now - t.daysAgo * 24 * 60 * 60 * 1000);
      const approvedAt = ["approved", "in_transit", "received"].includes(t.status)
        ? new Date(requestedAt.getTime() + 3 * 60 * 60 * 1000) : null;
      const shippedAt = ["in_transit", "received"].includes(t.status)
        ? new Date((approvedAt?.getTime() || requestedAt.getTime()) + 6 * 60 * 60 * 1000) : null;
      const estimatedArrival = t.status === "in_transit" ? new Date(now + 2 * 24 * 60 * 60 * 1000) : null;

      await prisma.transfer.create({
        data: {
          transferNumber: `TRF-${String(1000 + trfCount).padStart(5, "0")}`,
          fromLocationId: locMap[t.from].id,
          toLocationId: locMap[t.to].id,
          status: t.status,
          priority: t.priority,
          reason: t.reason,
          trackingNumber: t.tracking,
          shippingMethod: t.method,
          estimatedArrival,
          requestedById: userByName[t.requester].id,
          approvedById: t.approver ? userByName[t.approver].id : null,
          receivedById: t.receiver ? userByName[t.receiver].id : null,
          requestedAt,
          approvedAt,
          shippedAt,
          items: {
            create: t.items.map((it) => ({
              productId: prodBySku[it.sku].id,
              quantityRequested: it.qtyReq,
              quantityShipped: it.qtyShip ?? null,
              quantityReceived: it.qtyRec ?? null,
              unitCost: prodBySku[it.sku].costPrice,
            })),
          },
        },
      });
    }

    // Tasks
    const taskData = [
      { title: "Restock CBD Oil 500mg at Retail Store", status: "todo", priority: "high", category: "inventory" },
      { title: "Complete Q1 inventory audit", status: "in_progress", priority: "high", category: "inventory" },
      { title: "Review third-party lab results for new batch", status: "todo", priority: "urgent", category: "quality" },
      { title: "Process wholesale order for Green Valley Health", status: "in_progress", priority: "high", category: "orders" },
      { title: "Set up QuickBooks integration for auto-invoicing", status: "todo", priority: "medium", category: "admin" },
      { title: "Update COAs for Broad Spectrum CBD line", status: "review", priority: "high", category: "quality" },
      { title: "Organize warehouse shelving", status: "done", priority: "low", category: "inventory" },
      { title: "Send invoices for delivered orders", status: "done", priority: "high", category: "orders" },
    ];
    for (const td of taskData) {
      const dueOffset = td.status === "done" ? -5 : Math.floor(Math.random() * 14) - 3;
      await prisma.task.create({
        data: {
          title: td.title,
          status: td.status,
          priority: td.priority,
          category: td.category,
          dueDate: new Date(Date.now() + dueOffset * 24 * 60 * 60 * 1000),
          completedAt: td.status === "done" ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          assigneeId: users[Math.floor(Math.random() * users.length)].id,
          createdById: users[0].id,
        },
      });
    }

    // Alerts (transfer-related + others)
    const transfers = await prisma.transfer.findMany({
      include: { fromLocation: true, toLocation: true, items: true, requestedBy: true },
    });
    for (const tr of transfers) {
      if (tr.status === "requested") {
        await prisma.alert.create({
          data: {
            type: "transfer_request",
            severity: tr.priority === "urgent" ? "critical" : "warning",
            title: `Transfer Requested: ${tr.transferNumber}`,
            message: `${tr.requestedBy.name} at ${tr.toLocation.name} requested ${tr.items.length} item(s) from ${tr.fromLocation.name}. Awaiting approval.`,
            entityType: "transfer",
            entityId: tr.id,
          },
        });
      } else if (tr.status === "in_transit") {
        await prisma.alert.create({
          data: {
            type: "transfer_incoming",
            severity: "info",
            title: `Incoming Shipment: ${tr.transferNumber}`,
            message: `${tr.items.length} item(s) in transit from ${tr.fromLocation.name} → ${tr.toLocation.name}${tr.trackingNumber ? ` (${tr.trackingNumber})` : ""}.`,
            entityType: "transfer",
            entityId: tr.id,
          },
        });
      }
    }

    await prisma.alert.createMany({
      data: [
        { type: "low_stock", severity: "critical", title: "Out of Stock: CBD Oil 500mg", message: "CBD Oil Tincture 500mg is out of stock at Retail Store." },
        { type: "low_stock", severity: "warning", title: "Low Stock: CBD Gummies 30ct", message: "CBD Gummies 30ct has only 5 units remaining at Distribution Center." },
        { type: "system", severity: "info", title: "Katana Sync Ready", message: "Katana integration is configured. Run a Full Sync from Settings to import your real data." },
      ],
    });

    // Integration configs
    await prisma.integrationConfig.createMany({
      data: [
        { provider: "katana", isActive: false, baseUrl: "https://api.katanamrp.com/v1" },
        { provider: "quickbooks", isActive: false, baseUrl: "https://quickbooks.api.intuit.com/v3" },
      ],
    });

    return NextResponse.json({
      ok: true,
      created: {
        locations: locations.length,
        users: users.length,
        products: products.length,
        inventory: invRecords.length,
        sales: salesData.length,
        transfers: trfCount,
        tasks: taskData.length,
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
