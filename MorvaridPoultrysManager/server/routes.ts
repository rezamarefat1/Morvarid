import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  productionFormSchema, invoiceFormSchema, loginSchema, 
  farmFormSchema, userFormSchema, productFormSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت آمار" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      return res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت کاربران" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = userFormSchema.parse(req.body);
      
      if ((data.role === "recording_officer" || data.role === "sales_officer") && !data.assignedFarmId) {
        return res.status(400).json({ error: "تخصیص فارم برای این نقش الزامی است" });
      }
      
      const user = await storage.createUser(data);
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ایجاد کاربر" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const data = userFormSchema.partial().parse(req.body);
      const existingUser = await storage.getUser(req.params.id);
      
      if (!existingUser) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }
      
      const finalRole = data.role || existingUser.role;
      const finalFarmId = data.assignedFarmId !== undefined ? data.assignedFarmId : existingUser.assignedFarmId;
      
      if ((finalRole === "recording_officer" || finalRole === "sales_officer") && !finalFarmId) {
        return res.status(400).json({ error: "تخصیص فارم برای این نقش الزامی است" });
      }
      
      const user = await storage.updateUser(req.params.id, data);
      if (!user) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش کاربر" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "کاربر یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف کاربر" });
    }
  });

  app.get("/api/farms", async (req, res) => {
    try {
      const allFarms = await storage.getFarms();
      return res.json(allFarms);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت فارم‌ها" });
    }
  });

  app.get("/api/farms/active", async (req, res) => {
    try {
      const activeFarms = await storage.getActiveFarms();
      return res.json(activeFarms);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت فارم‌های فعال" });
    }
  });

  app.get("/api/farms/:id", async (req, res) => {
    try {
      const farm = await storage.getFarm(req.params.id);
      if (!farm) {
        return res.status(404).json({ error: "فارم یافت نشد" });
      }
      return res.json(farm);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/farms", async (req, res) => {
    try {
      const data = farmFormSchema.parse(req.body);
      const farm = await storage.createFarm(data);
      return res.status(201).json(farm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ایجاد فارم" });
    }
  });

  app.put("/api/farms/:id", async (req, res) => {
    try {
      const data = farmFormSchema.partial().parse(req.body);
      const farm = await storage.updateFarm(req.params.id, data);
      if (!farm) {
        return res.status(404).json({ error: "فارم یافت نشد" });
      }
      return res.json(farm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش فارم" });
    }
  });

  app.delete("/api/farms/:id", async (req, res) => {
    try {
      const success = await storage.deleteFarm(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "فارم یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف فارم" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      return res.json(allProducts);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت محصولات" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "محصول یافت نشد" });
      }
      return res.json(product);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const data = productFormSchema.parse(req.body);
      const product = await storage.createProduct(data);
      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ایجاد محصول" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const data = productFormSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ error: "محصول یافت نشد" });
      }
      return res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش محصول" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "محصول یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف محصول" });
    }
  });

  app.get("/api/production", async (req, res) => {
    try {
      const { farmId, date } = req.query;
      let records = await storage.getProductionRecords();
      
      if (farmId) {
        records = records.filter(r => r.farmId === farmId);
      }
      if (date) {
        records = records.filter(r => r.date === date);
      }
      
      return res.json(records);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت رکوردها" });
    }
  });

  app.get("/api/production/:id", async (req, res) => {
    try {
      const record = await storage.getProductionRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }
      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/production", async (req, res) => {
    try {
      const data = productionFormSchema.parse(req.body);
      const record = await storage.createProductionRecord({
        ...data,
        createdTime: new Date().toLocaleTimeString('fa-IR'),
      });
      return res.status(201).json(record);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: error.message || "خطا در ثبت رکورد" });
    }
  });

  app.put("/api/production/:id", async (req, res) => {
    try {
      const data = productionFormSchema.partial().parse(req.body);
      const record = await storage.updateProductionRecord(req.params.id, data);
      if (!record) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }
      return res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش رکورد" });
    }
  });

  app.delete("/api/production/:id", async (req, res) => {
    try {
      const success = await storage.deleteProductionRecord(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف رکورد" });
    }
  });

  app.get("/api/invoices", async (req, res) => {
    try {
      const { farmId, date, limit } = req.query;
      let invoices = await storage.getInvoices();
      
      if (farmId) {
        invoices = invoices.filter(i => i.farmId === farmId);
      }
      if (date) {
        invoices = invoices.filter(i => i.date === date);
      }
      if (limit) {
        invoices = invoices.slice(0, parseInt(limit as string, 10));
      }
      
      return res.json(invoices);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت حواله‌ها" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }
      return res.json(invoice);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const data = invoiceFormSchema.parse(req.body);
      const invoiceNumber = storage.generateInvoiceNumber();
      const totalPrice = data.quantity * data.pricePerUnit;
      
      const invoice = await storage.createInvoice({
        ...data,
        invoiceNumber,
        totalPrice,
        createdTime: new Date().toLocaleTimeString('fa-IR'),
      });
      return res.status(201).json(invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: error.message || "خطا در ثبت حواله" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const data = invoiceFormSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, data);
      if (!invoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }
      return res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش حواله" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف حواله" });
    }
  });

  app.get("/api/inventory/:farmId", async (req, res) => {
    try {
      const inventory = await storage.getInventory(req.params.farmId);
      return res.json(inventory || { farmId: req.params.farmId, currentEggStock: 0 });
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت موجودی" });
    }
  });

  return httpServer;
}
