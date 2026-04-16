import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.alert.deleteMany();
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

  // ─── Users ─────────────────────────────────────────────────
  const users = await Promise.all([
    prisma.user.create({
      data: { name: "Sarah Barros", email: "sarah@cellgenic.com", role: "admin" },
    }),
    prisma.user.create({
      data: { name: "David Chen", email: "david@cellgenic.com", role: "manager" },
    }),
    prisma.user.create({
      data: { name: "Maria Santos", email: "maria@cellgenic.com", role: "member" },
    }),
    prisma.user.create({
      data: { name: "James Wilson", email: "james@cellgenic.com", role: "member" },
    }),
    prisma.user.create({
      data: { name: "Ana Rodriguez", email: "ana@cellgenic.com", role: "member" },
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
  const locations = ["Main Warehouse", "Distribution Center", "Retail Store"];
  const inventoryRecords = [];

  for (const product of products) {
    for (const location of locations) {
      const baseQty = location === "Main Warehouse" ? 100 : location === "Distribution Center" ? 40 : 15;
      const variation = Math.floor(Math.random() * baseQty * 0.8);
      const quantity = Math.max(0, baseQty - variation);

      inventoryRecords.push(
        prisma.inventory.create({
          data: {
            productId: product.id,
            location,
            quantity,
            minimumThreshold: location === "Main Warehouse" ? 15 : location === "Distribution Center" ? 8 : 3,
            reorderPoint: location === "Main Warehouse" ? 30 : 15,
            reorderQuantity: location === "Main Warehouse" ? 100 : 50,
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

  // ─── Alerts ────────────────────────────────────────────────
  const alerts = [
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
