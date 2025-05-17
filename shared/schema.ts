import { pgTable, text, serial, integer, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and authentication
export const roles = {
  ADMIN: "admin",
  MANAGER: "manager",
  WORKER: "worker",
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default(roles.WORKER),
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export type Role = typeof roles[keyof typeof roles];
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  description: true,
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Suppliers
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Storage areas/zones
export const storageAreas = pgTable("storage_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  capacity: integer("capacity").notNull().default(0),
});

export const insertStorageAreaSchema = createInsertSchema(storageAreas).pick({
  name: true,
  description: true,
  capacity: true,
});

export type StorageArea = typeof storageAreas.$inferSelect;
export type InsertStorageArea = z.infer<typeof insertStorageAreaSchema>;

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  minStockLevel: integer("min_stock_level").notNull().default(0),
});

export const insertProductSchema = createInsertSchema(products).pick({
  sku: true,
  name: true,
  description: true,
  categoryId: true,
  supplierId: true,
  minStockLevel: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Product inventory by storage area
export const inventory = pgTable(
  "inventory",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    storageAreaId: integer("storage_area_id")
      .notNull()
      .references(() => storageAreas.id),
    quantity: integer("quantity").notNull().default(0),
  },
  (table) => {
    return {
      productStorageIdx: unique().on(table.productId, table.storageAreaId),
    };
  }
);

export const insertInventorySchema = createInsertSchema(inventory).pick({
  productId: true,
  storageAreaId: true,
  quantity: true,
});

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

// Movement status enum
export const movementStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Product movements
export const movements = pgTable("movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  fromAreaId: integer("from_area_id").references(() => storageAreas.id),
  toAreaId: integer("to_area_id").references(() => storageAreas.id),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default(movementStatus.PENDING),
  date: timestamp("date").notNull().defaultNow(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const insertMovementSchema = createInsertSchema(movements).pick({
  productId: true,
  fromAreaId: true,
  toAreaId: true,
  quantity: true,
  status: true,
  userId: true,
});

export type MovementStatus = typeof movementStatus[keyof typeof movementStatus];
export type Movement = typeof movements.$inferSelect;
export type InsertMovement = z.infer<typeof insertMovementSchema>;

// Extended types for frontend display
export type MovementWithDetails = Movement & {
  product: Product;
  fromArea?: StorageArea;
  toArea?: StorageArea;
  user: User;
};

export type ProductWithInventory = Product & {
  category?: Category;
  supplier?: Supplier;
  totalStock: number;
  inventoryByArea: (Inventory & { storageArea: StorageArea })[];
};

export type LowStockItem = {
  product: Product;
  category?: Category;
  currentStock: number;
  storageArea: StorageArea;
};

export type DashboardStats = {
  totalProducts: number;
  lowStockItems: number;
  pendingMovements: number;
  storageUtilization: number;
};
