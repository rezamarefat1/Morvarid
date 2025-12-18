import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import {
  productionFormSchema, invoiceFormSchema, loginSchema,
  farmFormSchema, userFormSchema, productFormSchema, createUserSchema, updateUserSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// Role-based authorization middleware
function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.session.user.role;
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Password hashing utility
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Rate limiting for auth endpoints specifically
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per windowMs
    message: { error: "Too many login attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user) {
        // To prevent user enumeration, use same response for user not found and wrong password
        await bcrypt.hash("", 1); // This ensures response time is consistent
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }

      // Store user info in session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        assignedFarmId: user.assignedFarmId,
      };

      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie('connect.sid'); // Clear session cookie
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user info
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.json(req.session.user);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.get("/api/stats/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت آمار" });
    }
  });

  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      return res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت کاربران" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
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

  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const data = createUserSchema.parse(req.body); // Use the proper schema with password validation

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

  app.put("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const data = updateUserSchema.parse(req.body); // Use the proper schema for updates
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

  app.delete("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.get("/api/farms", requireAuth, async (req, res) => {
    try {
      const allFarms = await storage.getFarms();
      return res.json(allFarms);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت فارم‌ها" });
    }
  });

  app.get("/api/farms/active", requireAuth, async (req, res) => {
    try {
      const activeFarms = await storage.getActiveFarms();
      return res.json(activeFarms);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت فارم‌های فعال" });
    }
  });

  app.get("/api/farms/:id", requireAuth, async (req, res) => {
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

  app.post("/api/farms", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.put("/api/farms/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.delete("/api/farms/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      return res.json(allProducts);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت محصولات" });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
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

  app.post("/api/products", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.put("/api/products/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.delete("/api/products/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
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

  app.get("/api/production", requireAuth, async (req, res) => {
    try {
      const { farmId, date } = req.query;
      let records = await storage.getProductionRecords();

      // Apply farm access control
      if (farmId) {
        // Only allow access to assigned farm for non-admin users
        if (req.session?.user?.role !== 'admin' && req.session?.user?.assignedFarmId !== farmId) {
          return res.status(403).json({ error: "دسترسی محدود شده است" });
        }
        records = records.filter(r => r.farmId === farmId);
      } else {
        // For non-admin users, only show records from their assigned farm
        if (req.session?.user?.role !== 'admin' && req.session?.user?.assignedFarmId) {
          records = records.filter(r => r.farmId === req.session.user.assignedFarmId);
        }
      }

      if (date) {
        records = records.filter(r => r.date === date);
      }

      return res.json(records);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت رکوردها" });
    }
  });

  app.get("/api/production/:id", requireAuth, async (req, res) => {
    try {
      const record = await storage.getProductionRecord(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && record.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      return res.json(record);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/production", requireAuth, async (req, res) => {
    try {
      const data = productionFormSchema.parse(req.body);

      // Check permission for the farm
      if (req.session?.user?.role !== 'admin' && data.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const record = await storage.createProductionRecord({
        ...data,
        userId: req.session?.user?.id,
        createdTime: new Date().toLocaleTimeString('fa-IR'),
      });
      return res.status(201).json(record);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error in production record creation:", error); // Log for debugging
      return res.status(500).json({ error: "خطا در ثبت رکورد" });
    }
  });

  app.put("/api/production/:id", requireAuth, async (req, res) => {
    try {
      const data = productionFormSchema.partial().parse(req.body);
      const record = await storage.getProductionRecord(req.params.id);

      if (!record) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && record.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const updatedRecord = await storage.updateProductionRecord(req.params.id, data);
      if (!updatedRecord) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }
      return res.json(updatedRecord);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش رکورد" });
    }
  });

  app.delete("/api/production/:id", requireAuth, async (req, res) => {
    try {
      const record = await storage.getProductionRecord(req.params.id);

      if (!record) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && record.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const success = await storage.deleteProductionRecord(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "رکورد یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف رکورد" });
    }
  });

  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const { farmId, date, limit } = req.query;
      let invoices = await storage.getInvoices();

      // Apply farm access control
      if (farmId) {
        // Only allow access to assigned farm for non-admin users
        if (req.session?.user?.role !== 'admin' && req.session?.user?.assignedFarmId !== farmId) {
          return res.status(403).json({ error: "دسترسی محدود شده است" });
        }
        invoices = invoices.filter(i => i.farmId === farmId);
      } else {
        // For non-admin users, only show invoices from their assigned farm
        if (req.session?.user?.role !== 'admin' && req.session?.user?.assignedFarmId) {
          invoices = invoices.filter(i => i.farmId === req.session.user.assignedFarmId);
        }
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

  app.get("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && invoice.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      return res.json(invoice);
    } catch (error) {
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const data = invoiceFormSchema.parse(req.body);

      // Check permission for the farm
      if (req.session?.user?.role !== 'admin' && data.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const invoiceNumber = await storage.generateInvoiceNumber();
      const totalPrice = data.quantity * data.pricePerUnit;

      const invoice = await storage.createInvoice({
        ...data,
        invoiceNumber,
        totalPrice,
        userId: req.session?.user?.id,
        createdTime: new Date().toLocaleTimeString('fa-IR'),
      });
      return res.status(201).json(invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error in invoice creation:", error); // Log for debugging
      return res.status(500).json({ error: "خطا در ثبت حواله" });
    }
  });

  app.put("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const data = invoiceFormSchema.partial().parse(req.body);
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && invoice.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const updatedInvoice = await storage.updateInvoice(req.params.id, data);
      if (!updatedInvoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }
      return res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ویرایش حواله" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);

      if (!invoice) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }

      // Apply access control
      if (req.session?.user?.role !== 'admin' && invoice.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "حواله یافت نشد" });
      }
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "خطا در حذف حواله" });
    }
  });

  app.get("/api/inventory/:farmId", requireAuth, async (req, res) => {
    try {
      // Apply access control
      if (req.session?.user?.role !== 'admin' && req.params.farmId !== req.session?.user?.assignedFarmId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const inventory = await storage.getInventory(req.params.farmId);
      return res.json(inventory || { farmId: req.params.farmId, currentEggStock: 0 });
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت موجودی" });
    }
  });

  app.post("/api/notifications", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { userId, title, message, type, farmId } = req.body;
      const notification = await storage.createNotification({
        userId,
        title,
        message,
        type,
        farmId,
      });
      return res.status(201).json(notification);
    } catch (error) {
      return res.status(500).json({ error: "خطا در ایجاد اعلان" });
    }
  });

  app.get("/api/notifications/:userId", requireAuth, async (req, res) => {
    try {
      // Only allow user to access their own notifications
      if (req.session?.user?.role !== 'admin' && req.session?.user?.id !== req.params.userId) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const notifications = await storage.getNotificationsByUser(req.params.userId);
      return res.json(notifications);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت اعلان‌ها" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "اعلان یافت نشد" });
      }

      // Only allow user to update their own notification
      if (req.session?.user?.role !== 'admin' && notification.userId !== req.session?.user?.id) {
        return res.status(403).json({ error: "دسترسی محدود شده است" });
      }

      const success = await storage.markNotificationAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "اعلان یافت نشد" });
      }
      return res.status(200).json({ message: "اعلان به عنوان خوانده‌شده علامت‌گذاری شد" });
    } catch (error) {
      return res.status(500).json({ error: "خطا در علامت‌گذاری اعلان" });
    }
  });

  return httpServer;
}
