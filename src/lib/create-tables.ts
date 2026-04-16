import { prisma } from "./db";

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "Location" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT, "type" TEXT NOT NULL DEFAULT 'warehouse', "address" TEXT, "city" TEXT, "country" TEXT DEFAULT 'USA', "managerName" TEXT, "managerEmail" TEXT, "phone" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Location_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'member', "avatar" TEXT, "locationId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Product" ("id" TEXT NOT NULL, "sku" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "category" TEXT NOT NULL, "brand" TEXT NOT NULL DEFAULT 'Cellgenic', "unitPrice" DOUBLE PRECISION NOT NULL, "costPrice" DOUBLE PRECISION NOT NULL, "imageUrl" TEXT, "katanaId" TEXT, "quickbooksId" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Product_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Inventory" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "location" TEXT NOT NULL DEFAULT 'Main Warehouse', "quantity" INTEGER NOT NULL, "minimumThreshold" INTEGER NOT NULL DEFAULT 10, "reorderPoint" INTEGER NOT NULL DEFAULT 20, "reorderQuantity" INTEGER NOT NULL DEFAULT 50, "lastRestocked" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "ProductDocument" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "fileUrl" TEXT NOT NULL, "fileSize" INTEGER, "uploadedBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProductDocument_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "SaleRecord" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "unitPrice" DOUBLE PRECISION NOT NULL, "totalAmount" DOUBLE PRECISION NOT NULL, "channel" TEXT NOT NULL DEFAULT 'direct', "customerName" TEXT, "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SaleRecord_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Order" ("id" TEXT NOT NULL, "orderNumber" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'sales', "status" TEXT NOT NULL DEFAULT 'pending', "customerName" TEXT, "customerEmail" TEXT, "supplierName" TEXT, "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0, "notes" TEXT, "createdById" TEXT NOT NULL, "katanaOrderId" TEXT, "quickbooksInvoiceId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Order_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "OrderItem" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantity" INTEGER NOT NULL, "unitPrice" DOUBLE PRECISION NOT NULL, "total" DOUBLE PRECISION NOT NULL, CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "OrderComment" ("id" TEXT NOT NULL, "orderId" TEXT NOT NULL, "userId" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Task" ("id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "status" TEXT NOT NULL DEFAULT 'todo', "priority" TEXT NOT NULL DEFAULT 'medium', "category" TEXT NOT NULL DEFAULT 'general', "dueDate" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "assigneeId" TEXT, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Task_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "ActivityLog" ("id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL, "details" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "IntegrationConfig" ("id" TEXT NOT NULL, "provider" TEXT NOT NULL, "apiKey" TEXT, "apiSecret" TEXT, "baseUrl" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT false, "lastSyncAt" TIMESTAMP(3), "settings" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "IntegrationConfig_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Transfer" ("id" TEXT NOT NULL, "transferNumber" TEXT NOT NULL, "fromLocationId" TEXT NOT NULL, "toLocationId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'requested', "priority" TEXT NOT NULL DEFAULT 'normal', "reason" TEXT, "notes" TEXT, "trackingNumber" TEXT, "shippingMethod" TEXT, "estimatedArrival" TIMESTAMP(3), "requestedById" TEXT NOT NULL, "approvedById" TEXT, "receivedById" TEXT, "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "approvedAt" TIMESTAMP(3), "shippedAt" TIMESTAMP(3), "receivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "TransferItem" ("id" TEXT NOT NULL, "transferId" TEXT NOT NULL, "productId" TEXT NOT NULL, "quantityRequested" INTEGER NOT NULL, "quantityShipped" INTEGER, "quantityReceived" INTEGER, "unitCost" DOUBLE PRECISION, "notes" TEXT, CONSTRAINT "TransferItem_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "TransferComment" ("id" TEXT NOT NULL, "transferId" TEXT NOT NULL, "userId" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "TransferComment_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "Alert" ("id" TEXT NOT NULL, "type" TEXT NOT NULL, "severity" TEXT NOT NULL DEFAULT 'warning', "title" TEXT NOT NULL, "message" TEXT NOT NULL, "entityType" TEXT, "entityId" TEXT, "isRead" BOOLEAN NOT NULL DEFAULT false, "isDismissed" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Alert_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "InventoryHistory" ("id" TEXT NOT NULL, "productId" TEXT NOT NULL, "location" TEXT NOT NULL, "previousQty" INTEGER NOT NULL, "newQty" INTEGER NOT NULL, "changeQty" INTEGER NOT NULL, "changeType" TEXT NOT NULL, "source" TEXT NOT NULL, "syncId" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "InventoryHistory_pkey" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "SyncLog" ("id" TEXT NOT NULL, "scope" TEXT NOT NULL, "status" TEXT NOT NULL, "trigger" TEXT NOT NULL, "productsCreated" INTEGER NOT NULL DEFAULT 0, "productsUpdated" INTEGER NOT NULL DEFAULT 0, "inventorySynced" INTEGER NOT NULL DEFAULT 0, "inventoryChanged" INTEGER NOT NULL DEFAULT 0, "locationsCreated" INTEGER NOT NULL DEFAULT 0, "locationsUpdated" INTEGER NOT NULL DEFAULT 0, "ordersCreated" INTEGER NOT NULL DEFAULT 0, "ordersUpdated" INTEGER NOT NULL DEFAULT 0, "errorMessage" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id"))`,
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Location_name_key" ON "Location"("name")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Location_code_key" ON "Location"("code")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Inventory_productId_location_key" ON "Inventory"("productId", "location")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "IntegrationConfig_provider_key" ON "IntegrationConfig"("provider")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Transfer_transferNumber_key" ON "Transfer"("transferNumber")`,
  `CREATE INDEX IF NOT EXISTS "InventoryHistory_productId_idx" ON "InventoryHistory"("productId")`,
  `CREATE INDEX IF NOT EXISTS "InventoryHistory_location_idx" ON "InventoryHistory"("location")`,
  `CREATE INDEX IF NOT EXISTS "InventoryHistory_createdAt_idx" ON "InventoryHistory"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "InventoryHistory_syncId_idx" ON "InventoryHistory"("syncId")`,
  `CREATE INDEX IF NOT EXISTS "SyncLog_startedAt_idx" ON "SyncLog"("startedAt")`,
];

const FOREIGN_KEYS = [
  { table: "User", name: "User_locationId_fkey", col: "locationId", ref: `"Location"("id")`, onDelete: "SET NULL" },
  { table: "Inventory", name: "Inventory_productId_fkey", col: "productId", ref: `"Product"("id")`, onDelete: "CASCADE" },
  { table: "ProductDocument", name: "ProductDocument_productId_fkey", col: "productId", ref: `"Product"("id")`, onDelete: "CASCADE" },
  { table: "SaleRecord", name: "SaleRecord_productId_fkey", col: "productId", ref: `"Product"("id")`, onDelete: "CASCADE" },
  { table: "Order", name: "Order_createdById_fkey", col: "createdById", ref: `"User"("id")`, onDelete: "RESTRICT" },
  { table: "OrderItem", name: "OrderItem_orderId_fkey", col: "orderId", ref: `"Order"("id")`, onDelete: "CASCADE" },
  { table: "OrderItem", name: "OrderItem_productId_fkey", col: "productId", ref: `"Product"("id")`, onDelete: "RESTRICT" },
  { table: "OrderComment", name: "OrderComment_orderId_fkey", col: "orderId", ref: `"Order"("id")`, onDelete: "CASCADE" },
  { table: "OrderComment", name: "OrderComment_userId_fkey", col: "userId", ref: `"User"("id")`, onDelete: "RESTRICT" },
  { table: "Task", name: "Task_assigneeId_fkey", col: "assigneeId", ref: `"User"("id")`, onDelete: "SET NULL" },
  { table: "Task", name: "Task_createdById_fkey", col: "createdById", ref: `"User"("id")`, onDelete: "RESTRICT" },
  { table: "ActivityLog", name: "ActivityLog_userId_fkey", col: "userId", ref: `"User"("id")`, onDelete: "SET NULL" },
  { table: "Transfer", name: "Transfer_fromLocationId_fkey", col: "fromLocationId", ref: `"Location"("id")`, onDelete: "RESTRICT" },
  { table: "Transfer", name: "Transfer_toLocationId_fkey", col: "toLocationId", ref: `"Location"("id")`, onDelete: "RESTRICT" },
  { table: "Transfer", name: "Transfer_requestedById_fkey", col: "requestedById", ref: `"User"("id")`, onDelete: "RESTRICT" },
  { table: "Transfer", name: "Transfer_approvedById_fkey", col: "approvedById", ref: `"User"("id")`, onDelete: "SET NULL" },
  { table: "Transfer", name: "Transfer_receivedById_fkey", col: "receivedById", ref: `"User"("id")`, onDelete: "SET NULL" },
  { table: "TransferItem", name: "TransferItem_transferId_fkey", col: "transferId", ref: `"Transfer"("id")`, onDelete: "CASCADE" },
  { table: "TransferComment", name: "TransferComment_transferId_fkey", col: "transferId", ref: `"Transfer"("id")`, onDelete: "CASCADE" },
  { table: "TransferComment", name: "TransferComment_userId_fkey", col: "userId", ref: `"User"("id")`, onDelete: "RESTRICT" },
  { table: "InventoryHistory", name: "InventoryHistory_productId_fkey", col: "productId", ref: `"Product"("id")`, onDelete: "CASCADE" },
];

export async function createAllTables(): Promise<{ tables: number; indexes: number; fkeys: number }> {
  let tables = 0, indexes = 0, fkeys = 0;

  for (const sql of TABLES) {
    await prisma.$executeRawUnsafe(sql);
    tables++;
  }

  for (const sql of INDEXES) {
    await prisma.$executeRawUnsafe(sql);
    indexes++;
  }

  for (const fk of FOREIGN_KEYS) {
    try {
      await prisma.$executeRawUnsafe(
        `DO $$ BEGIN ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY ("${fk.col}") REFERENCES ${fk.ref} ON DELETE ${fk.onDelete} ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`
      );
      fkeys++;
    } catch {
      // Skip foreign key errors silently
    }
  }

  return { tables, indexes, fkeys };
}
