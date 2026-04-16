export interface DashboardMetrics {
  totalProducts: number;
  totalInventoryValue: number;
  lowStockCount: number;
  pendingOrders: number;
  pendingTasks: number;
  monthlyRevenue: number;
  revenueChange: number;
  topProducts: TopProduct[];
  recentAlerts: AlertData[];
  salesTrend: SalesTrendPoint[];
  inventoryByLocation: LocationInventory[];
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  totalSold: number;
  revenue: number;
}

export interface AlertData {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface LocationInventory {
  location: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    unitPrice: number;
    costPrice: number;
  };
  location: string;
  quantity: number;
  minimumThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked: string | null;
  status: "ok" | "low" | "critical" | "out_of_stock";
}

export interface ProductWithDetails {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  brand: string;
  unitPrice: number;
  costPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  documents: ProductDocumentData[];
  inventory: {
    location: string;
    quantity: number;
  }[];
}

export interface ProductDocumentData {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  uploadedBy: string | null;
  createdAt: string;
}

export interface OrderWithDetails {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  supplierName: string | null;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: { id: string; name: string; sku: string };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string };
  }[];
}

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: { id: string; name: string } | null;
  createdBy: { id: string; name: string };
}
