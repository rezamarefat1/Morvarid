import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { productionFormSchema, invoiceFormSchema, loginSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Authentication
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباه است" });
      }
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطای سرور" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats/dashboard", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت آمار" });
    }
  });

  // Production Records
  app.get("/api/production", async (req, res) => {
    try {
      const records = await storage.getProductionRecords();
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
      const record = await storage.createProductionRecord(data);
      return res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ثبت رکورد" });
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

  // Sales Invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
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
      const invoiceNumber = (storage as any).generateInvoiceNumber();
      const totalPrice = data.eggQuantity * data.pricePerUnit;
      
      const invoice = await storage.createInvoice({
        ...data,
        invoiceNumber,
        totalPrice,
      });
      return res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      return res.status(500).json({ error: "خطا در ثبت حواله" });
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

  // Inventory
  app.get("/api/inventory/:farmType", async (req, res) => {
    try {
      const farmType = req.params.farmType as "morvaridi" | "motafarreqe";
      if (farmType !== "morvaridi" && farmType !== "motafarreqe") {
        return res.status(400).json({ error: "نوع فارم نامعتبر است" });
      }
      const inventory = await storage.getInventory(farmType);
      return res.json(inventory);
    } catch (error) {
      return res.status(500).json({ error: "خطا در دریافت موجودی" });
    }
  });

  return httpServer;
}
