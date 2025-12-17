import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Farm types
export type FarmType = "morvaridi" | "motafarreqe";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  biometricEnabled: boolean("biometric_enabled").default(false),
  biometricCredentialId: text("biometric_credential_id"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Production Records table
export const productionRecords = pgTable("production_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmType: text("farm_type").notNull().$type<FarmType>(),
  date: text("date").notNull(), // Jalali date string YYYY/MM/DD
  eggCount: integer("egg_count").notNull().default(0),
  brokenEggs: integer("broken_eggs").notNull().default(0),
  mortality: integer("mortality").notNull().default(0),
  feedConsumption: real("feed_consumption").notNull().default(0), // kg
  waterConsumption: real("water_consumption").notNull().default(0), // liters
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductionSchema = createInsertSchema(productionRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertProduction = z.infer<typeof insertProductionSchema>;
export type ProductionRecord = typeof productionRecords.$inferSelect;

// Sales Invoices (Havaleh) table
export const salesInvoices = pgTable("sales_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  farmType: text("farm_type").notNull().$type<FarmType>(),
  date: text("date").notNull(), // Jalali date string
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  eggQuantity: integer("egg_quantity").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  totalPrice: real("total_price").notNull(),
  isPaid: boolean("is_paid").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(salesInvoices).omit({
  id: true,
  createdAt: true,
  invoiceNumber: true,
  totalPrice: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SalesInvoice = typeof salesInvoices.$inferSelect;

// Inventory table for tracking current stock
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmType: text("farm_type").notNull().$type<FarmType>(),
  currentEggStock: integer("current_egg_stock").notNull().default(0),
  totalBirds: integer("total_birds").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Dashboard Statistics type (computed, not stored)
export interface DashboardStats {
  totalEggsToday: number;
  totalEggsThisWeek: number;
  totalEggsThisMonth: number;
  morvaridiEggsToday: number;
  motafarreqeEggsToday: number;
  totalSalesToday: number;
  totalSalesThisMonth: number;
  mortalityThisWeek: number;
  currentInventory: {
    morvaridi: number;
    motafarreqe: number;
  };
}

// Form validation schemas with Persian error messages
export const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const productionFormSchema = z.object({
  farmType: z.enum(["morvaridi", "motafarreqe"], {
    required_error: "نوع فارم الزامی است",
  }),
  date: z.string().min(1, "تاریخ الزامی است"),
  eggCount: z.number().min(0, "تعداد تخم‌مرغ نمی‌تواند منفی باشد"),
  brokenEggs: z.number().min(0, "تعداد تخم‌مرغ شکسته نمی‌تواند منفی باشد"),
  mortality: z.number().min(0, "تلفات نمی‌تواند منفی باشد"),
  feedConsumption: z.number().min(0, "مصرف دان نمی‌تواند منفی باشد"),
  waterConsumption: z.number().min(0, "مصرف آب نمی‌تواند منفی باشد"),
  notes: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  farmType: z.enum(["morvaridi", "motafarreqe"], {
    required_error: "نوع فارم الزامی است",
  }),
  date: z.string().min(1, "تاریخ الزامی است"),
  customerName: z.string().min(1, "نام مشتری الزامی است"),
  customerPhone: z.string().optional(),
  eggQuantity: z.number().min(1, "تعداد تخم‌مرغ باید حداقل ۱ باشد"),
  pricePerUnit: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type ProductionForm = z.infer<typeof productionFormSchema>;
export type InvoiceForm = z.infer<typeof invoiceFormSchema>;
