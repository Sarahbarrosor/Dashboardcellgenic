import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.transferComment.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.orderComment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.task.deleteMany();
  await prisma.saleRecord.deleteMany();
  await prisma.productDocument.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.integrationConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();

  // ─── Locations ─────────────────────────────────────────────
  const locationData = [
    { name: "Main Warehouse", code: "MWH", type: "warehouse", address: "1500 Industrial Blvd", city: "Los Angeles", managerName: "David Chen", managerEmail: "david@cellgenic.com", phone: "(310) 555-0101" },
    { name: "Distribution Center", code: "DIS", type: "distribution", address: "400 Logistics Way", city: "Chicago", managerName: "Maria Santos", managerEmail: "maria@cellgenic.com", phone: "(312) 555-0102" },
    { name: "East Coast Hub", code: "EAS", type: "warehouse", address: "88 Harbor Dr", city: "Newark", managerName: "James Wilson", managerEmail: "james@cellgenic.com", phone: "(973) 555-0103" },
    { name: "West Coast Hub", code: "WES", type: "warehouse", address: "2200 Pacific Coast Hwy", city: "Long Beach", managerName: "Ana Rodriguez", managerEmail: "ana@cellgenic.com", phone: "(562) 555-0104" },
    { name: "Retail Store", code: "RET", type: "retail", address: "42 Main Street", city: "San Diego", managerName: "Sarah Barros", managerEmail: "sarah@cellgenic.com", phone: "(619) 555-0105" },
    { name: "International Depot", code: "INT", type: "depot", address: "Port Complex, Terminal 4", city: "Miami", country: "USA", managerName: "David Chen", managerEmail: "david@cellgenic.com", phone: "(305) 555-0106" },
  ];

  const createdLocations = await Promise.all(
    locationData.map((loc) => prisma.location.create({ data: loc }))
  );
  const locationsByName = Object.fromEntries(createdLocations.map((l) => [l.name, l]));
  console.log(`  Created ${createdLocations.length} locations`);

  // ─── Users ─────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.create({
      data: { name: "Sarah Barros", email: "sarah@cellgenic.com", role: "admin", locationId: locationsByName["Retail Store"].id },
    }),
    prisma.user.create({
      data: { name: "David Chen", email: "david@cellgenic.com", role: "manager", locationId: locationsByName["Main Warehouse"].id },
    }),
    prisma.user.create({
      data: { name: "Maria Santos", email: "maria@cellgenic.com", role: "manager", locationId: locationsByName["Distribution Center"].id },
    }),
    prisma.user.create({
      data: { name: "James Wilson", email: "james@cellgenic.com", role: "manager", locationId: locationsByName["East Coast Hub"].id },
    }),
    prisma.user.create({
      data: { name: "Ana Rodriguez", email: "ana@cellgenic.com", role: "manager", locationId: locationsByName["West Coast Hub"].id },
    }),
    prisma.user.create({
      data: { name: "Carlos Pereira", email: "carlos@cellgenic.com", role: "member", locationId: locationsByName["International Depot"].id },
    }),
  ]);
  console.log(`  Created ${users.length} users`);

  // ─── Products ──────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "CG-CBD-500",
        name: "CBD Oil Tincture 500mg",
        description: "Full-spectrum CBD oil tincture, 500mg, 30ml bottle. Third-party tested for purity and potency.",
        category: "CBD Oils",
        unitPrice: 49.99,
        costPrice: 18.50,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-CBD-1000",
        name: "CBD Oil Tincture 1000mg",
        description: "Full-spectrum CBD oil tincture, 1000mg, 30ml bottle. Third-party tested.",
        category: "CBD Oils",
        unitPrice: 79.99,
        costPrice: 28.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-CBD-2000",
        name: "CBD Oil Tincture 2000mg",
        description: "Full-spectrum CBD oil tincture, 2000mg, 60ml bottle. Premium grade.",
        category: "CBD Oils",
        unitPrice: 129.99,
        costPrice: 42.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-CAP-30",
        name: "CBD Capsules 30ct",
        description: "CBD capsules, 25mg each, 30 count bottle. Easy-to-swallow softgels.",
        category: "Capsules",
        unitPrice: 39.99,
        costPrice: 14.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-CAP-60",
        name: "CBD Capsules 60ct",
        description: "CBD capsules, 25mg each, 60 count bottle.",
        category: "Capsules",
        unitPrice: 69.99,
        costPrice: 24.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-TOP-100",
        name: "CBD Topical Cream 100mg",
        description: "CBD-infused topical cream for targeted relief. 100mg CBD, 2oz jar.",
        category: "Topicals",
        unitPrice: 34.99,
        costPrice: 12.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-TOP-250",
        name: "CBD Topical Cream 250mg",
        description: "CBD-infused topical cream, 250mg CBD, 4oz jar. Extra strength.",
        category: "Topicals",
        unitPrice: 54.99,
        costPrice: 19.50,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-GUM-30",
        name: "CBD Gummies 30ct",
        description: "CBD gummies, 10mg each, assorted fruit flavors, 30 count.",
        category: "Edibles",
        unitPrice: 29.99,
        costPrice: 10.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-GUM-60",
        name: "CBD Gummies 60ct",
        description: "CBD gummies, 10mg each, assorted fruit flavors, 60 count.",
        category: "Edibles",
        unitPrice: 49.99,
        costPrice: 17.50,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-PET-300",
        name: "Pet CBD Oil 300mg",
        description: "CBD oil formulated for pets, 300mg, bacon-flavored, 30ml.",
        category: "Pet Products",
        unitPrice: 39.99,
        costPrice: 14.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-SLP-500",
        name: "CBD Sleep Formula 500mg",
        description: "CBD oil with melatonin and lavender for sleep support, 500mg, 30ml.",
        category: "CBD Oils",
        unitPrice: 59.99,
        costPrice: 22.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-RLX-500",
        name: "CBD Relaxation Blend 500mg",
        description: "CBD oil with chamomile and passionflower, 500mg, 30ml.",
        category: "CBD Oils",
        unitPrice: 54.99,
        costPrice: 20.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-ISO-1000",
        name: "CBD Isolate Powder 1000mg",
        description: "Pure CBD isolate powder, 99%+ purity, 1000mg.",
        category: "Isolates",
        unitPrice: 44.99,
        costPrice: 15.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-BAL-50",
        name: "CBD Muscle Balm 50ml",
        description: "Concentrated CBD muscle balm with menthol and arnica, 500mg CBD.",
        category: "Topicals",
        unitPrice: 44.99,
        costPrice: 16.00,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CG-BRD-750",
        name: "Broad Spectrum CBD 750mg",
        description: "Broad spectrum CBD oil, THC-free, 750mg, 30ml.",
        category: "CBD Oils",
        unitPrice: 64.99,
        costPrice: 24.00,
      },
    }),
  ]);
  console.log(`  Created ${products.length} products`);

  // ─── Inventory ─────────────────────────────────────────────
  const locationNames = createdLocations.map((l) => l.name);
  const baseQuantityByType: Record<string, number> = {
    warehouse: 100,
    distribution: 50,
    depot: 70,
    retail: 15,
    office: 0,
  };
  const inventoryRecords = [];

  for (const product of products) {
    for (const loc of createdLocations) {
      const baseQty = baseQuantityByType[loc.type] ?? 30;
      const variation = Math.floor(Math.random() * baseQty * 0.8);
      const quantity = Math.max(0, baseQty - variation);

      inventoryRecords.push(
        prisma.inventory.create({
          data: {
            productId: product.id,
            location: loc.name,
            quantity,
            minimumThreshold: loc.type === "warehouse" ? 15 : loc.type === "retail" ? 3 : 8,
            reorderPoint: loc.type === "warehouse" ? 30 : 15,
            reorderQuantity: loc.type === "warehouse" ? 100 : 50,
            lastRestocked: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }
  }
  await Promise.all(inventoryRecords);
  console.log(`  Created ${inventoryRecords.length} inventory records`);

  // ─── Product Documents ─────────────────────────────────────
  const docTypes = ["coa", "first_party_test", "third_party_test", "brochure"];
  const docRecords = [];
  for (const product of products) {
    for (const type of docTypes) {
      if (Math.random() > 0.3) {
        docRecords.push(
          prisma.productDocument.create({
            data: {
              productId: product.id,
              name: `${product.name} - ${type === "coa" ? "Certificate of Analysis" : type === "first_party_test" ? "First-Party Lab Test" : type === "third_party_test" ? "Third-Party Lab Test" : "Product Brochure"}`,
              type,
              fileUrl: `/documents/${product.sku.toLowerCase()}-${type}.pdf`,
              fileSize: Math.floor(Math.random() * 5000000) + 100000,
              uploadedBy: users[Math.floor(Math.random() * users.length)].name,
            },
          })
        );
      }
    }
  }
  await Promise.all(docRecords);
  console.log(`  Created ${docRecords.length} product documents`);

  // ─── Sales Records (last 180 days) ─────────────────────────
  const channels = ["direct", "online", "wholesale", "distributor"];
  const customers = [
    "Green Valley Health", "Wellness First", "Natural Remedies Co",
    "Pacific Health Store", "Mountain Top Organics", "Coastal Wellness",
    "Urban Health Hub", "Sunrise Supplements", "Pure Life Store",
    "Harmony Health", "VitalCare Pharmacy", "FreshStart Wellness",
  ];
  const salesRecords = [];

  for (let daysAgo = 180; daysAgo >= 0; daysAgo--) {
    const numSales = Math.floor(Math.random() * 8) + 2;
    for (let i = 0; i < numSales; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 20) + 1;
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const discount = channel === "wholesale" ? 0.85 : channel === "distributor" ? 0.75 : 1;
      const unitPrice = Math.round(product.unitPrice * discount * 100) / 100;

      salesRecords.push({
        productId: product.id,
        quantity,
        unitPrice,
        totalAmount: Math.round(quantity * unitPrice * 100) / 100,
        channel,
        customerName: customers[Math.floor(Math.random() * customers.length)],
        saleDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000),
      });
    }
  }

  // Batch create sales
  for (let i = 0; i < salesRecords.length; i += 50) {
    const batch = salesRecords.slice(i, i + 50);
    await Promise.all(batch.map((record) => prisma.saleRecord.create({ data: record })));
  }
  console.log(`  Created ${salesRecords.length} sales records`);

  // ─── Orders ────────────────────────────────────────────────
  const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const orders = [];
  for (let i = 0; i < 25; i++) {
    const type = i < 15 ? "sales" : i < 22 ? "purchase" : "internal";
    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    const prefix = type === "purchase" ? "PO" : type === "internal" ? "IO" : "SO";
    const orderProducts = products.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 4) + 1);

    const items = orderProducts.map((p) => {
      const qty = Math.floor(Math.random() * 30) + 1;
      return {
        productId: p.id,
        quantity: qty,
        unitPrice: p.unitPrice,
        total: Math.round(qty * p.unitPrice * 100) / 100,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    orders.push(
      prisma.order.create({
        data: {
          orderNumber: `${prefix}-${String(1001 + i).padStart(5, "0")}`,
          type,
          status,
          customerName: type !== "purchase" ? customers[Math.floor(Math.random() * customers.length)] : null,
          customerEmail: type !== "purchase" ? `contact@${customers[Math.floor(Math.random() * customers.length)].toLowerCase().replace(/\s+/g, "")}.com` : null,
          supplierName: type === "purchase" ? ["Raw Materials Co", "BioExtract Labs", "Hemp Source Inc", "PackagePro"][Math.floor(Math.random() * 4)] : null,
          totalAmount,
          notes: Math.random() > 0.5 ? "Standard shipping. Please include packing slip." : null,
          createdById: users[Math.floor(Math.random() * users.length)].id,
          createdAt: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
          items: { create: items },
        },
      })
    );
  }
  const createdOrders = await Promise.all(orders);
  console.log(`  Created ${createdOrders.length} orders`);

  // ─── Order Comments ────────────────────────────────────────
  const commentTemplates = [
    "Customer confirmed receipt. Everything looks good.",
    "Tracking number has been updated and sent to customer.",
    "Waiting for supplier confirmation on delivery date.",
    "Quality check passed. Ready for shipping.",
    "Customer requested express shipping upgrade.",
    "Invoice sent via QuickBooks.",
    "Packaging completed, waiting for pickup.",
    "Customer asked about bulk discount for next order.",
    "Payment received and confirmed.",
    "Shipped via FedEx. ETA 3-5 business days.",
  ];

  const comments = [];
  for (const order of createdOrders) {
    const numComments = Math.floor(Math.random() * 4);
    for (let i = 0; i < numComments; i++) {
      comments.push(
        prisma.orderComment.create({
          data: {
            orderId: order.id,
            userId: users[Math.floor(Math.random() * users.length)].id,
            content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        })
      );
    }
  }
  await Promise.all(comments);
  console.log(`  Created ${comments.length} order comments`);

  // ─── Tasks ─────────────────────────────────────────────────
  const taskData = [
    { title: "Restock CBD Oil Tincture 500mg at Main Warehouse", status: "todo", priority: "high", category: "inventory" },
    { title: "Complete Q1 inventory audit", status: "in_progress", priority: "high", category: "inventory" },
    { title: "Review third-party lab results for new batch", status: "todo", priority: "urgent", category: "quality" },
    { title: "Update product brochures with new pricing", status: "in_progress", priority: "medium", category: "admin" },
    { title: "Process wholesale order for Green Valley Health", status: "in_progress", priority: "high", category: "orders" },
    { title: "Schedule meeting with Hemp Source Inc supplier", status: "todo", priority: "medium", category: "general" },
    { title: "Set up QuickBooks integration for auto-invoicing", status: "todo", priority: "medium", category: "admin" },
    { title: "Ship pending orders from last week", status: "review", priority: "urgent", category: "shipping" },
    { title: "Create social media content for new product launch", status: "todo", priority: "low", category: "general" },
    { title: "Prepare monthly sales report", status: "in_progress", priority: "medium", category: "admin" },
    { title: "Contact Pacific Health Store about recurring order", status: "todo", priority: "medium", category: "orders" },
    { title: "Update COAs for Broad Spectrum CBD line", status: "review", priority: "high", category: "quality" },
    { title: "Organize warehouse shelving for new products", status: "done", priority: "low", category: "inventory" },
    { title: "Fix labeling discrepancy on CBD Capsules batch", status: "done", priority: "urgent", category: "quality" },
    { title: "Send invoices for delivered orders", status: "done", priority: "high", category: "orders" },
    { title: "Review and approve new product packaging design", status: "review", priority: "medium", category: "quality" },
    { title: "Train new team member on order processing", status: "todo", priority: "medium", category: "admin" },
    { title: "Negotiate shipping rates with FedEx", status: "todo", priority: "low", category: "shipping" },
  ];

  const tasks = [];
  for (const task of taskData) {
    const dueOffset = task.status === "done" ? -5 : Math.floor(Math.random() * 14) - 3;
    tasks.push(
      prisma.task.create({
        data: {
          title: task.title,
          description: `Task assigned from operations workflow. Category: ${task.category}`,
          status: task.status,
          priority: task.priority,
          category: task.category,
          dueDate: new Date(Date.now() + dueOffset * 24 * 60 * 60 * 1000),
          completedAt: task.status === "done" ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) : null,
          assigneeId: users[Math.floor(Math.random() * users.length)].id,
          createdById: users[0].id,
        },
      })
    );
  }
  await Promise.all(tasks);
  console.log(`  Created ${tasks.length} tasks`);

  // ─── Transfers ─────────────────────────────────────────────
  const transferScenarios = [
    {
      fromName: "Main Warehouse",
      toName: "Retail Store",
      status: "in_transit",
      priority: "high",
      reason: "Retail floor restocking after weekend sales surge",
      trackingNumber: "INT-TRK-88291",
      shippingMethod: "internal_fleet",
      requester: "Sarah Barros",
      approver: "David Chen",
      items: [
        { sku: "CG-CBD-500", qtyReq: 30, qtyShip: 30 },
        { sku: "CG-GUM-30", qtyReq: 40, qtyShip: 40 },
        { sku: "CG-TOP-100", qtyReq: 15, qtyShip: 15 },
      ],
      daysAgo: 1,
    },
    {
      fromName: "Distribution Center",
      toName: "East Coast Hub",
      status: "requested",
      priority: "urgent",
      reason: "East Coast Hub running critically low on top-sellers before trade show",
      requester: "James Wilson",
      items: [
        { sku: "CG-CBD-1000", qtyReq: 50 },
        { sku: "CG-CBD-2000", qtyReq: 25 },
        { sku: "CG-BRD-750", qtyReq: 30 },
      ],
      daysAgo: 0,
    },
    {
      fromName: "Main Warehouse",
      toName: "West Coast Hub",
      status: "approved",
      priority: "normal",
      reason: "Weekly restock cycle",
      requester: "Ana Rodriguez",
      approver: "David Chen",
      items: [
        { sku: "CG-CAP-30", qtyReq: 60, qtyShip: 60 },
        { sku: "CG-CAP-60", qtyReq: 40, qtyShip: 40 },
        { sku: "CG-SLP-500", qtyReq: 25, qtyShip: 25 },
      ],
      daysAgo: 1,
    },
    {
      fromName: "East Coast Hub",
      toName: "International Depot",
      status: "in_transit",
      priority: "normal",
      reason: "Export preparation for Mexico distributor",
      trackingNumber: "FDX-4872-11",
      shippingMethod: "courier",
      requester: "Carlos Pereira",
      approver: "James Wilson",
      items: [
        { sku: "CG-ISO-1000", qtyReq: 20, qtyShip: 20 },
        { sku: "CG-BAL-50", qtyReq: 15, qtyShip: 15 },
      ],
      daysAgo: 2,
    },
    {
      fromName: "Main Warehouse",
      toName: "Distribution Center",
      status: "received",
      priority: "normal",
      reason: "Scheduled monthly replenishment",
      trackingNumber: "INT-TRK-88102",
      shippingMethod: "internal_fleet",
      requester: "Maria Santos",
      approver: "David Chen",
      receiver: "Maria Santos",
      items: [
        { sku: "CG-CBD-500", qtyReq: 50, qtyShip: 50, qtyRec: 50 },
        { sku: "CG-CBD-1000", qtyReq: 40, qtyShip: 40, qtyRec: 40 },
        { sku: "CG-RLX-500", qtyReq: 20, qtyShip: 20, qtyRec: 20 },
      ],
      daysAgo: 7,
    },
    {
      fromName: "West Coast Hub",
      toName: "Retail Store",
      status: "requested",
      priority: "high",
      reason: "Retail Store needs gummies & topicals urgently",
      requester: "Sarah Barros",
      items: [
        { sku: "CG-GUM-60", qtyReq: 25 },
        { sku: "CG-TOP-250", qtyReq: 12 },
      ],
      daysAgo: 0,
    },
  ];

  const productsBySku = Object.fromEntries(products.map((p) => [p.sku, p]));
  const usersByName = Object.fromEntries(users.map((u) => [u.name, u]));

  let transferCount = 0;
  for (const scenario of transferScenarios) {
    transferCount++;
    const now = Date.now();
    const requestedAt = new Date(now - scenario.daysAgo * 24 * 60 * 60 * 1000);
    const approvedAt = ["approved", "in_transit", "received"].includes(scenario.status)
      ? new Date(requestedAt.getTime() + 3 * 60 * 60 * 1000) : null;
    const shippedAt = ["in_transit", "received"].includes(scenario.status)
      ? new Date((approvedAt?.getTime() || requestedAt.getTime()) + 6 * 60 * 60 * 1000) : null;
    const receivedAt = scenario.status === "received"
      ? new Date((shippedAt?.getTime() || requestedAt.getTime()) + 2 * 24 * 60 * 60 * 1000) : null;
    const estimatedArrival = scenario.status === "in_transit"
      ? new Date(now + 2 * 24 * 60 * 60 * 1000) : null;

    await prisma.transfer.create({
      data: {
        transferNumber: `TRF-${String(1000 + transferCount).padStart(5, "0")}`,
        fromLocationId: locationsByName[scenario.fromName].id,
        toLocationId: locationsByName[scenario.toName].id,
        status: scenario.status,
        priority: scenario.priority,
        reason: scenario.reason,
        trackingNumber: scenario.trackingNumber,
        shippingMethod: scenario.shippingMethod,
        estimatedArrival,
        requestedById: usersByName[scenario.requester].id,
        approvedById: scenario.approver ? usersByName[scenario.approver].id : null,
        receivedById: scenario.receiver ? usersByName[scenario.receiver].id : null,
        requestedAt,
        approvedAt,
        shippedAt,
        receivedAt,
        items: {
          create: scenario.items.map((it) => {
            const item = it as { sku: string; qtyReq: number; qtyShip?: number; qtyRec?: number };
            return {
              productId: productsBySku[item.sku].id,
              quantityRequested: item.qtyReq,
              quantityShipped: item.qtyShip ?? null,
              quantityReceived: item.qtyRec ?? null,
              unitCost: productsBySku[item.sku].costPrice,
            };
          }),
        },
      },
    });
  }
  console.log(`  Created ${transferCount} transfers`);

  // ─── Alerts ────────────────────────────────────────────────
  const transfers = await prisma.transfer.findMany({
    include: { fromLocation: true, toLocation: true, items: true, requestedBy: true },
  });

  const transferAlerts = [];
  for (const t of transfers) {
    if (t.status === "requested") {
      transferAlerts.push({
        type: "transfer_request",
        severity: t.priority === "urgent" ? "critical" : "warning",
        title: `Transfer Requested: ${t.transferNumber}`,
        message: `${t.requestedBy.name} at ${t.toLocation.name} requested ${t.items.length} item(s) from ${t.fromLocation.name}. Awaiting approval.`,
        entityType: "transfer",
        entityId: t.id,
      });
    } else if (t.status === "in_transit") {
      transferAlerts.push({
        type: "transfer_incoming",
        severity: "info",
        title: `Incoming Shipment: ${t.transferNumber}`,
        message: `${t.items.length} item(s) in transit from ${t.fromLocation.name} → ${t.toLocation.name}${t.trackingNumber ? ` (${t.trackingNumber})` : ""}.`,
        entityType: "transfer",
        entityId: t.id,
      });
    } else if (t.status === "approved") {
      transferAlerts.push({
        type: "transfer_approved",
        severity: "info",
        title: `Transfer Approved: ${t.transferNumber}`,
        message: `Transfer from ${t.fromLocation.name} to ${t.toLocation.name} has been approved and is being prepared for shipment.`,
        entityType: "transfer",
        entityId: t.id,
      });
    }
  }

  const alerts = [
    ...transferAlerts,
    { type: "low_stock", severity: "critical", title: "Out of Stock: CBD Oil Tincture 500mg", message: "CBD Oil Tincture 500mg (CG-CBD-500) is out of stock at Retail Store. Immediate restock required." },
    { type: "low_stock", severity: "warning", title: "Low Stock: CBD Gummies 30ct", message: "CBD Gummies 30ct has only 5 units remaining at Distribution Center (min: 8)." },
    { type: "low_stock", severity: "warning", title: "Low Stock: Pet CBD Oil 300mg", message: "Pet CBD Oil 300mg has only 3 units remaining at Main Warehouse (min: 15)." },
    { type: "overdue_task", severity: "warning", title: "Overdue: Review third-party lab results", message: "Task 'Review third-party lab results for new batch' is 2 days past its due date." },
    { type: "reorder", severity: "info", title: "Reorder Suggestion: CBD Capsules 30ct", message: "CBD Capsules 30ct inventory has reached the reorder point. Consider placing a purchase order." },
    { type: "order_status", severity: "info", title: "Order SO-01003 Shipped", message: "Order SO-01003 for Green Valley Health has been shipped via FedEx." },
    { type: "system", severity: "info", title: "Katana Sync Available", message: "Katana integration is configured. Enable it in Settings to start syncing inventory data." },
  ];

  await Promise.all(alerts.map((alert) => prisma.alert.create({ data: alert })));
  console.log(`  Created ${alerts.length} alerts`);

  // ─── Integration Configs ───────────────────────────────────
  await Promise.all([
    prisma.integrationConfig.create({
      data: { provider: "katana", isActive: false, baseUrl: "https://api.katanamrp.com/v1" },
    }),
    prisma.integrationConfig.create({
      data: { provider: "quickbooks", isActive: false, baseUrl: "https://quickbooks.api.intuit.com/v3" },
    }),
  ]);
  console.log("  Created integration configs");

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
