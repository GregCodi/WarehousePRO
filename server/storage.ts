import {
  users,
  categories,
  suppliers,
  products,
  storageAreas,
  inventory,
  movements,
  roles,
  movementStatus,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
  type StorageArea,
  type InsertStorageArea,
  type Inventory,
  type InsertInventory,
  type Movement,
  type InsertMovement,
  type DashboardStats,
  type MovementWithDetails,
  type ProductWithInventory,
  type LowStockItem,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Categories
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Suppliers
  getSupplier(id: number): Promise<Supplier | undefined>;
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductWithInventory(id: number): Promise<ProductWithInventory | undefined>;
  getAllProductsWithInventory(): Promise<ProductWithInventory[]>;

  // Storage areas
  getStorageArea(id: number): Promise<StorageArea | undefined>;
  getStorageAreas(): Promise<StorageArea[]>;
  createStorageArea(area: InsertStorageArea): Promise<StorageArea>;
  updateStorageArea(id: number, updates: Partial<StorageArea>): Promise<StorageArea | undefined>;
  deleteStorageArea(id: number): Promise<boolean>;

  // Inventory
  getInventory(productId: number, storageAreaId: number): Promise<Inventory | undefined>;
  getInventoryByProduct(productId: number): Promise<Inventory[]>;
  getInventoryByStorageArea(storageAreaId: number): Promise<Inventory[]>;
  updateInventory(productId: number, storageAreaId: number, quantity: number): Promise<Inventory>;
  
  // Movements
  getMovement(id: number): Promise<Movement | undefined>;
  getMovements(): Promise<Movement[]>;
  getRecentMovements(limit: number): Promise<MovementWithDetails[]>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  updateMovementStatus(id: number, status: string): Promise<Movement | undefined>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getLowStockItems(): Promise<LowStockItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private suppliers: Map<number, Supplier>;
  private products: Map<number, Product>;
  private storageAreas: Map<number, StorageArea>;
  private inventoryItems: Map<string, Inventory>; // composite key: productId-storageAreaId
  private movements: Map<number, Movement>;
  
  private userCurrentId: number;
  private categoryCurrentId: number;
  private supplierCurrentId: number;
  private productCurrentId: number;
  private storageAreaCurrentId: number;
  private inventoryCurrentId: number;
  private movementCurrentId: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.suppliers = new Map();
    this.products = new Map();
    this.storageAreas = new Map();
    this.inventoryItems = new Map();
    this.movements = new Map();
    
    this.userCurrentId = 1;
    this.categoryCurrentId = 1;
    this.supplierCurrentId = 1;
    this.productCurrentId = 1;
    this.storageAreaCurrentId = 1;
    this.inventoryCurrentId = 1;
    this.movementCurrentId = 1;
    
    // Initialize with seed data
    this.initializeSeedData();
  }

  private async initializeSeedData() {
    // Create an admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    this.createUser({
      username: "admin",
      password: adminPassword,
      fullName: "Admin User",
      role: roles.ADMIN,
    });

    // Create a manager user
    const managerPassword = await bcrypt.hash("manager123", 10);
    this.createUser({
      username: "manager",
      password: managerPassword,
      fullName: "Manager User",
      role: roles.MANAGER,
    });

    // Create a worker user
    const workerPassword = await bcrypt.hash("worker123", 10);
    this.createUser({
      username: "worker",
      password: workerPassword,
      fullName: "Worker User",
      role: roles.WORKER,
    });

    // Create sample categories
    const electronics = this.createCategory({
      name: "Electronics",
      description: "Electronic devices and accessories",
    });
    
    const accessories = this.createCategory({
      name: "Accessories",
      description: "Various accessories for electronic devices",
    });

    // Create sample suppliers
    const techSupplier = this.createSupplier({
      name: "Tech Solutions Inc.",
      contactName: "John Smith",
      email: "john@techsolutions.com",
      phone: "555-1234",
      address: "123 Tech St, San Francisco, CA",
    });
    
    const accessorySupplier = this.createSupplier({
      name: "Accessory World",
      contactName: "Jane Doe",
      email: "jane@accessoryworld.com",
      phone: "555-5678",
      address: "456 Market St, San Francisco, CA",
    });

    // Create storage areas
    const zoneA = this.createStorageArea({
      name: "Zone A",
      description: "Main storage area for electronics",
      capacity: 1000,
    });
    
    const zoneB = this.createStorageArea({
      name: "Zone B",
      description: "Storage for accessories",
      capacity: 2000,
    });
    
    const zoneC = this.createStorageArea({
      name: "Zone C",
      description: "Overflow storage area",
      capacity: 1500,
    });
    
    const receiving = this.createStorageArea({
      name: "Receiving",
      description: "Receiving area for new inventory",
      capacity: 500,
    });
    
    const shipping = this.createStorageArea({
      name: "Shipping Area",
      description: "Area for items ready to be shipped",
      capacity: 500,
    });

    // Create products
    const headphones = this.createProduct({
      sku: "WH-BT-001",
      name: "Wireless Headphones",
      description: "Premium wireless headphones with noise cancellation",
      categoryId: electronics.id,
      supplierId: techSupplier.id,
      minStockLevel: 20,
    });
    
    const earbuds = this.createProduct({
      sku: "WE-BT-002",
      name: "Wireless Earbuds",
      description: "Compact wireless earbuds with charging case",
      categoryId: electronics.id,
      supplierId: techSupplier.id,
      minStockLevel: 20,
    });
    
    const laptopStand = this.createProduct({
      sku: "LS-001",
      name: "Laptop Stand",
      description: "Adjustable aluminum laptop stand",
      categoryId: accessories.id,
      supplierId: accessorySupplier.id,
      minStockLevel: 30,
    });
    
    const usbCables = this.createProduct({
      sku: "UC-001",
      name: "USB-C Cables",
      description: "USB-C to USB-C fast charging cables, 6ft",
      categoryId: accessories.id,
      supplierId: accessorySupplier.id,
      minStockLevel: 30,
    });
    
    const keyboard = this.createProduct({
      sku: "KB-WL-001",
      name: "Wireless Keyboard",
      description: "Slim wireless keyboard with numeric keypad",
      categoryId: electronics.id,
      supplierId: techSupplier.id,
      minStockLevel: 15,
    });
    
    const speakers = this.createProduct({
      sku: "SP-BT-001",
      name: "Bluetooth Speakers",
      description: "Portable Bluetooth speakers with 20hr battery life",
      categoryId: electronics.id,
      supplierId: techSupplier.id,
      minStockLevel: 15,
    });
    
    const hdmiCables = this.createProduct({
      sku: "HDMI-001",
      name: "HDMI Cables",
      description: "4K HDMI cables, 3ft",
      categoryId: accessories.id,
      supplierId: accessorySupplier.id,
      minStockLevel: 30,
    });
    
    const phoneChargers = this.createProduct({
      sku: "PC-001",
      name: "Phone Chargers",
      description: "Fast charging wall adapters",
      categoryId: electronics.id,
      supplierId: techSupplier.id,
      minStockLevel: 15,
    });
    
    const laptopBags = this.createProduct({
      sku: "LB-001",
      name: "Laptop Bags",
      description: "Padded laptop bags with multiple compartments",
      categoryId: accessories.id,
      supplierId: accessorySupplier.id,
      minStockLevel: 20,
    });

    // Add inventory
    this.updateInventory(headphones.id, zoneA.id, 50);
    this.updateInventory(earbuds.id, zoneA.id, 5);
    this.updateInventory(laptopStand.id, zoneB.id, 80);
    this.updateInventory(usbCables.id, zoneC.id, 100);
    this.updateInventory(keyboard.id, zoneA.id, 32);
    this.updateInventory(speakers.id, zoneB.id, 30);
    this.updateInventory(hdmiCables.id, zoneC.id, 8);
    this.updateInventory(phoneChargers.id, zoneB.id, 12);
    this.updateInventory(laptopBags.id, zoneA.id, 14);

    // Create some sample movements
    const admin = Array.from(this.users.values()).find(user => user.role === roles.ADMIN);
    if (admin) {
      // Headphone movement
      this.createMovement({
        productId: headphones.id,
        fromAreaId: zoneA.id,
        toAreaId: shipping.id,
        quantity: 24,
        status: movementStatus.COMPLETED,
        userId: admin.id,
      });
      
      // Laptop stand movement
      this.createMovement({
        productId: laptopStand.id,
        fromAreaId: receiving.id,
        toAreaId: zoneB.id,
        quantity: 50,
        status: movementStatus.COMPLETED,
        userId: admin.id,
      });
      
      // USB cables movement
      this.createMovement({
        productId: usbCables.id,
        fromAreaId: zoneC.id,
        toAreaId: zoneA.id,
        quantity: 100,
        status: movementStatus.PENDING,
        userId: admin.id,
      });
      
      // Keyboard movement
      this.createMovement({
        productId: keyboard.id,
        fromAreaId: zoneA.id,
        toAreaId: shipping.id,
        quantity: 12,
        status: movementStatus.COMPLETED,
        userId: admin.id,
      });
      
      // Speakers movement
      this.createMovement({
        productId: speakers.id,
        fromAreaId: receiving.id,
        toAreaId: zoneB.id,
        quantity: 30,
        status: movementStatus.IN_PROGRESS,
        userId: admin.id,
      });
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, active: true };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Categories
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Check if any products are using this category
    const hasProducts = Array.from(this.products.values()).some(
      product => product.categoryId === id
    );
    
    if (hasProducts) {
      return false;
    }
    
    return this.categories.delete(id);
  }

  // Suppliers
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierCurrentId++;
    const newSupplier: Supplier = { ...supplier, id };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updatedSupplier = { ...supplier, ...updates };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    // Check if any products are using this supplier
    const hasProducts = Array.from(this.products.values()).some(
      product => product.supplierId === id
    );
    
    if (hasProducts) {
      return false;
    }
    
    return this.suppliers.delete(id);
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      product => product.sku === sku
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productCurrentId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    // Delete all inventory entries for this product
    Array.from(this.inventoryItems.values())
      .filter(item => item.productId === id)
      .forEach(item => {
        this.inventoryItems.delete(`${item.productId}-${item.storageAreaId}`);
      });
    
    // Delete all movements for this product
    Array.from(this.movements.values())
      .filter(movement => movement.productId === id)
      .forEach(movement => {
        this.movements.delete(movement.id);
      });
    
    return this.products.delete(id);
  }

  async getProductWithInventory(id: number): Promise<ProductWithInventory | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const inventoryItems = Array.from(this.inventoryItems.values())
      .filter(item => item.productId === id);
    
    const totalStock = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const category = product.categoryId ? this.categories.get(product.categoryId) : undefined;
    const supplier = product.supplierId ? this.suppliers.get(product.supplierId) : undefined;
    
    const inventoryByArea = inventoryItems.map(item => ({
      ...item,
      storageArea: this.storageAreas.get(item.storageAreaId)!
    }));
    
    return {
      ...product,
      category,
      supplier,
      totalStock,
      inventoryByArea
    };
  }

  async getAllProductsWithInventory(): Promise<ProductWithInventory[]> {
    const products = Array.from(this.products.values());
    return Promise.all(products.map(product => this.getProductWithInventory(product.id))) as Promise<ProductWithInventory[]>;
  }

  // Storage areas
  async getStorageArea(id: number): Promise<StorageArea | undefined> {
    return this.storageAreas.get(id);
  }

  async getStorageAreas(): Promise<StorageArea[]> {
    return Array.from(this.storageAreas.values());
  }

  async createStorageArea(area: InsertStorageArea): Promise<StorageArea> {
    const id = this.storageAreaCurrentId++;
    const newArea: StorageArea = { ...area, id };
    this.storageAreas.set(id, newArea);
    return newArea;
  }

  async updateStorageArea(id: number, updates: Partial<StorageArea>): Promise<StorageArea | undefined> {
    const area = this.storageAreas.get(id);
    if (!area) return undefined;
    
    const updatedArea = { ...area, ...updates };
    this.storageAreas.set(id, updatedArea);
    return updatedArea;
  }

  async deleteStorageArea(id: number): Promise<boolean> {
    // Check if any inventory is stored in this area
    const hasInventory = Array.from(this.inventoryItems.values()).some(
      item => item.storageAreaId === id
    );
    
    if (hasInventory) {
      return false;
    }
    
    // Check if any movements reference this area
    const hasMovements = Array.from(this.movements.values()).some(
      movement => movement.fromAreaId === id || movement.toAreaId === id
    );
    
    if (hasMovements) {
      return false;
    }
    
    return this.storageAreas.delete(id);
  }

  // Inventory
  async getInventory(productId: number, storageAreaId: number): Promise<Inventory | undefined> {
    return this.inventoryItems.get(`${productId}-${storageAreaId}`);
  }

  async getInventoryByProduct(productId: number): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values()).filter(
      item => item.productId === productId
    );
  }

  async getInventoryByStorageArea(storageAreaId: number): Promise<Inventory[]> {
    return Array.from(this.inventoryItems.values()).filter(
      item => item.storageAreaId === storageAreaId
    );
  }

  async updateInventory(productId: number, storageAreaId: number, quantity: number): Promise<Inventory> {
    const key = `${productId}-${storageAreaId}`;
    const existingInventory = this.inventoryItems.get(key);
    
    if (existingInventory) {
      const updatedInventory = { ...existingInventory, quantity };
      this.inventoryItems.set(key, updatedInventory);
      return updatedInventory;
    } else {
      const id = this.inventoryCurrentId++;
      const newInventory: Inventory = { id, productId, storageAreaId, quantity };
      this.inventoryItems.set(key, newInventory);
      return newInventory;
    }
  }

  // Movements
  async getMovement(id: number): Promise<Movement | undefined> {
    return this.movements.get(id);
  }

  async getMovements(): Promise<Movement[]> {
    return Array.from(this.movements.values());
  }

  async getRecentMovements(limit: number): Promise<MovementWithDetails[]> {
    const allMovements = Array.from(this.movements.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    return allMovements.map(movement => {
      const product = this.products.get(movement.productId)!;
      const fromArea = movement.fromAreaId ? this.storageAreas.get(movement.fromAreaId) : undefined;
      const toArea = movement.toAreaId ? this.storageAreas.get(movement.toAreaId) : undefined;
      const user = this.users.get(movement.userId)!;
      
      return {
        ...movement,
        product,
        fromArea,
        toArea,
        user
      };
    });
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    const id = this.movementCurrentId++;
    const date = new Date();
    const newMovement: Movement = { ...movement, id, date };
    this.movements.set(id, newMovement);
    
    // If the movement is completed, update the inventory
    if (movement.status === movementStatus.COMPLETED) {
      // Deduct from the source area
      if (movement.fromAreaId) {
        const sourceInventory = await this.getInventory(movement.productId, movement.fromAreaId);
        if (sourceInventory) {
          await this.updateInventory(
            movement.productId,
            movement.fromAreaId,
            Math.max(0, sourceInventory.quantity - movement.quantity)
          );
        }
      }
      
      // Add to the destination area
      if (movement.toAreaId) {
        const destInventory = await this.getInventory(movement.productId, movement.toAreaId);
        const currentQuantity = destInventory ? destInventory.quantity : 0;
        await this.updateInventory(
          movement.productId,
          movement.toAreaId,
          currentQuantity + movement.quantity
        );
      }
    }
    
    return newMovement;
  }

  async updateMovementStatus(id: number, status: string): Promise<Movement | undefined> {
    const movement = this.movements.get(id);
    if (!movement) return undefined;
    
    // If we're completing a pending movement, update inventory
    if (status === movementStatus.COMPLETED && movement.status !== movementStatus.COMPLETED) {
      // Deduct from source area
      if (movement.fromAreaId) {
        const sourceInventory = await this.getInventory(movement.productId, movement.fromAreaId);
        if (sourceInventory) {
          await this.updateInventory(
            movement.productId,
            movement.fromAreaId,
            Math.max(0, sourceInventory.quantity - movement.quantity)
          );
        }
      }
      
      // Add to destination area
      if (movement.toAreaId) {
        const destInventory = await this.getInventory(movement.productId, movement.toAreaId);
        const currentQuantity = destInventory ? destInventory.quantity : 0;
        await this.updateInventory(
          movement.productId,
          movement.toAreaId,
          currentQuantity + movement.quantity
        );
      }
    }
    
    const updatedMovement = { ...movement, status };
    this.movements.set(id, updatedMovement);
    return updatedMovement;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    // Total products
    const totalProducts = this.products.size;
    
    // Low stock items
    const lowStockItems = (await this.getLowStockItems()).length;
    
    // Pending movements
    const pendingMovements = Array.from(this.movements.values()).filter(
      movement => movement.status === movementStatus.PENDING || 
                 movement.status === movementStatus.IN_PROGRESS
    ).length;
    
    // Storage utilization - calculate the percentage of storage capacity used
    const areas = Array.from(this.storageAreas.values());
    const totalCapacity = areas.reduce((sum, area) => sum + area.capacity, 0);
    
    const inventoryByArea = areas.map(area => {
      const areaInventory = Array.from(this.inventoryItems.values())
        .filter(item => item.storageAreaId === area.id);
      return {
        area,
        itemCount: areaInventory.reduce((sum, item) => sum + item.quantity, 0)
      };
    });
    
    const totalItemsStored = inventoryByArea.reduce((sum, item) => sum + item.itemCount, 0);
    const storageUtilization = totalCapacity > 0 ? Math.round((totalItemsStored / totalCapacity) * 100) : 0;
    
    return {
      totalProducts,
      lowStockItems,
      pendingMovements,
      storageUtilization
    };
  }

  async getLowStockItems(): Promise<LowStockItem[]> {
    const productsWithInventory = await this.getAllProductsWithInventory();
    
    const lowStockItems: LowStockItem[] = [];
    
    for (const product of productsWithInventory) {
      if (product.totalStock <= product.minStockLevel) {
        // Find which storage area has the product
        for (const invItem of product.inventoryByArea) {
          lowStockItems.push({
            product,
            category: product.category,
            currentStock: invItem.quantity,
            storageArea: invItem.storageArea
          });
        }
      }
    }
    
    return lowStockItems;
  }
}

export const storage = new MemStorage();
