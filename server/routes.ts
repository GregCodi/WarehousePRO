import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateJWT, isAdmin, isAdminOrManager, isAuthenticated, authenticateUser, generateToken } from "./auth";
import { z } from "zod";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertSupplierSchema, insertStorageAreaSchema, insertMovementSchema } from "@shared/schema";
import { createObjectCsvStringifier } from "csv-writer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      const token = generateToken(user);
      
      // Don't send the password in the response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard
  app.get("/api/dashboard/stats", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/low-stock", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/recent-movements", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const movements = await storage.getRecentMovements(limit);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management
  app.get("/api/users", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const userSchema = insertUserSchema.extend({
        password: z.string().min(6)
      });
      
      const validatedData = userSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await import("bcryptjs").then(bcrypt => 
        bcrypt.hash(validatedData.password, 10)
      );
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/users/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userSchema = z.object({
        username: z.string().optional(),
        fullName: z.string().optional(),
        role: z.string().optional(),
        active: z.boolean().optional(),
        password: z.string().min(6).optional()
      });
      
      const validatedData = userSchema.parse(req.body);
      
      // If updating username, check if it already exists
      if (validatedData.username && validatedData.username !== user.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // If updating password, hash it
      if (validatedData.password) {
        validatedData.password = await import("bcryptjs").then(bcrypt => 
          bcrypt.hash(validatedData.password as string, 10)
        );
      }
      
      const updatedUser = await storage.updateUser(id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/users/:id", authenticateJWT, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting the last admin
      const users = await storage.getUsers();
      const admins = users.filter(user => user.role === "admin");
      
      if (admins.length === 1 && admins[0].id === id) {
        return res.status(400).json({ message: "Cannot delete the last admin user" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Categories
  app.get("/api/categories", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/categories/:id", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/categories/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/categories/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete: category is in use or not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/suppliers/:id", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplier = await storage.getSupplier(id);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/suppliers", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/suppliers/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.updateSupplier(id, validatedData);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/suppliers/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSupplier(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete: supplier is in use or not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Products
  app.get("/api/products", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const withInventory = req.query.withInventory === "true";
      
      if (withInventory) {
        const products = await storage.getAllProductsWithInventory();
        res.json(products);
      } else {
        const products = await storage.getProducts();
        res.json(products);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const withInventory = req.query.withInventory === "true";
      
      if (withInventory) {
        const product = await storage.getProductWithInventory(id);
        
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        res.json(product);
      } else {
        const product = await storage.getProduct(id);
        
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        res.json(product);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/products/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.updateProduct(id, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/products/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Storage Areas
  app.get("/api/storage-areas", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const areas = await storage.getStorageAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/storage-areas/:id", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const area = await storage.getStorageArea(id);
      
      if (!area) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/storage-areas", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const validatedData = insertStorageAreaSchema.parse(req.body);
      const area = await storage.createStorageArea(validatedData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/storage-areas/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStorageAreaSchema.parse(req.body);
      const area = await storage.updateStorageArea(id, validatedData);
      
      if (!area) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      
      res.json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/storage-areas/:id", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStorageArea(id);
      
      if (!success) {
        return res.status(400).json({ message: "Cannot delete: storage area is in use or not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Inventory
  app.get("/api/inventory/product/:productId", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const inventory = await storage.getInventoryByProduct(productId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/inventory/area/:areaId", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId);
      const inventory = await storage.getInventoryByStorageArea(areaId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/inventory", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const schema = z.object({
        productId: z.number(),
        storageAreaId: z.number(),
        quantity: z.number().min(0),
      });
      
      const validatedData = schema.parse(req.body);
      
      // Check if product and storage area exist
      const product = await storage.getProduct(validatedData.productId);
      const area = await storage.getStorageArea(validatedData.storageAreaId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (!area) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      
      const inventory = await storage.updateInventory(
        validatedData.productId,
        validatedData.storageAreaId,
        validatedData.quantity
      );
      
      res.status(201).json(inventory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Movements
  app.get("/api/movements", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const movements = await storage.getMovements();
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/movements/:id", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const movement = await storage.getMovement(id);
      
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }
      
      res.json(movement);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/movements", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      // Modify the schema to require the current user's ID
      const validatedData = insertMovementSchema.parse({
        ...req.body,
        userId: req.userId // Set user ID from authenticated user
      });
      
      // Check if product, source area, and destination area exist
      const product = await storage.getProduct(validatedData.productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (validatedData.fromAreaId) {
        const sourceArea = await storage.getStorageArea(validatedData.fromAreaId);
        
        if (!sourceArea) {
          return res.status(404).json({ message: "Source storage area not found" });
        }
        
        // Check if there's enough inventory in the source area
        const sourceInventory = await storage.getInventory(validatedData.productId, validatedData.fromAreaId);
        
        if (!sourceInventory || sourceInventory.quantity < validatedData.quantity) {
          return res.status(400).json({ 
            message: "Insufficient inventory in source location",
            available: sourceInventory ? sourceInventory.quantity : 0 
          });
        }
      }
      
      if (validatedData.toAreaId) {
        const destArea = await storage.getStorageArea(validatedData.toAreaId);
        
        if (!destArea) {
          return res.status(404).json({ message: "Destination storage area not found" });
        }
      }
      
      const movement = await storage.createMovement(validatedData);
      res.status(201).json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/movements/:id/status", authenticateJWT, isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schema = z.object({
        status: z.string()
      });
      
      const validatedData = schema.parse(req.body);
      const movement = await storage.updateMovementStatus(id, validatedData.status);
      
      if (!movement) {
        return res.status(404).json({ message: "Movement not found" });
      }
      
      res.json(movement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Reports
  app.get("/api/reports/inventory/csv", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const products = await storage.getAllProductsWithInventory();
      
      // Define the CSV header
      const csvStringifier = createObjectCsvStringifier({
        header: [
          {id: 'sku', title: 'SKU'},
          {id: 'name', title: 'Product Name'},
          {id: 'category', title: 'Category'},
          {id: 'totalStock', title: 'Total Stock'},
          {id: 'minStockLevel', title: 'Min Stock Level'},
          {id: 'supplier', title: 'Supplier'},
        ]
      });
      
      // Format data for CSV
      const records = products.map(product => ({
        sku: product.sku,
        name: product.name,
        category: product.category ? product.category.name : 'N/A',
        totalStock: product.totalStock,
        minStockLevel: product.minStockLevel,
        supplier: product.supplier ? product.supplier.name : 'N/A',
      }));
      
      // Create the CSV content
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
      
      // Send the CSV content
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports/movements/csv", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const movements = await storage.getRecentMovements(1000); // Get up to 1000 recent movements
      
      // Define the CSV header
      const csvStringifier = createObjectCsvStringifier({
        header: [
          {id: 'id', title: 'ID'},
          {id: 'date', title: 'Date'},
          {id: 'product', title: 'Product'},
          {id: 'fromArea', title: 'From Area'},
          {id: 'toArea', title: 'To Area'},
          {id: 'quantity', title: 'Quantity'},
          {id: 'status', title: 'Status'},
          {id: 'user', title: 'Created By'},
        ]
      });
      
      // Format data for CSV
      const records = movements.map(movement => ({
        id: movement.id,
        date: new Date(movement.date).toLocaleString(),
        product: movement.product.name,
        fromArea: movement.fromArea ? movement.fromArea.name : 'N/A',
        toArea: movement.toArea ? movement.toArea.name : 'N/A',
        quantity: movement.quantity,
        status: movement.status,
        user: movement.user.fullName,
      }));
      
      // Create the CSV content
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=movements-report.csv');
      
      // Send the CSV content
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports/low-stock/csv", authenticateJWT, isAdminOrManager, async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      
      // Define the CSV header
      const csvStringifier = createObjectCsvStringifier({
        header: [
          {id: 'sku', title: 'SKU'},
          {id: 'name', title: 'Product Name'},
          {id: 'category', title: 'Category'},
          {id: 'currentStock', title: 'Current Stock'},
          {id: 'minStockLevel', title: 'Min Stock Level'},
          {id: 'storageArea', title: 'Storage Area'},
        ]
      });
      
      // Format data for CSV
      const records = lowStockItems.map(item => ({
        sku: item.product.sku,
        name: item.product.name,
        category: item.category ? item.category.name : 'N/A',
        currentStock: item.currentStock,
        minStockLevel: item.product.minStockLevel,
        storageArea: item.storageArea.name,
      }));
      
      // Create the CSV content
      const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=low-stock-report.csv');
      
      // Send the CSV content
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
