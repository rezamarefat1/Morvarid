import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type UserRole = "admin" | "recording_officer" | "sales_officer";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique().$defaultFn(() => sql`NULLIF(TRIM(both ' ' from username), '')`), // Prevents empty usernames with only spaces
  password: text("password").notNull(), // Will be hashed
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("recording_officer").$type<UserRole>(),
  assignedFarmId: varchar("assigned_farm_id"),
  isActive: boolean("is_active").default(true),
  biometricEnabled: boolean("biometric_enabled").default(false),
  biometricCredentialId: text("biometric_credential_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  assignedFarmId: true,
  isActive: true,
});

// Schema for user creation with password validation
export const createUserSchema = insertUserSchema.extend({
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

// Schema for user update (password optional)
export const updateUserSchema = insertUserSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const farms = pgTable("farms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  totalBirds: integer("total_birds").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  unit: text("unit"), // واحد شمارش: کیلوگرم، کارتن، شانه، عدد، بسته
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const productionRecords = pgTable("production_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  userId: varchar("user_id"),
  date: text("date").notNull(),
  eggCount: integer("egg_count").notNull().default(0),
  brokenEggs: integer("broken_eggs").notNull().default(0),
  mortality: integer("mortality").notNull().default(0),
  feedConsumption: real("feed_consumption").notNull().default(0),
  waterConsumption: real("water_consumption").notNull().default(0),
  yesterdayInventory: integer("yesterday_inventory").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdTime: text("created_time"),
});

export const insertProductionSchema = createInsertSchema(productionRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertProduction = z.infer<typeof insertProductionSchema>;
export type ProductionRecord = typeof productionRecords.$inferSelect;

export const salesInvoices = pgTable("sales_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  farmId: varchar("farm_id").notNull(),
  userId: varchar("user_id"),
  productId: varchar("product_id"),
  date: text("date").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  quantity: integer("quantity").notNull(),
  weight: real("weight"),
  pricePerUnit: real("price_per_unit").notNull(),
  totalPrice: real("total_price").notNull(),
  isPaid: boolean("is_paid").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdTime: text("created_time"),
});

export const insertInvoiceSchema = createInsertSchema(salesInvoices).omit({
  id: true,
  createdAt: true,
  invoiceNumber: true,
  totalPrice: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SalesInvoice = typeof salesInvoices.$inferSelect;

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  farmId: varchar("farm_id").notNull(),
  currentEggStock: integer("current_egg_stock").notNull().default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'statistics' | 'invoice'
  farmId: varchar("farm_id").references(() => farms.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export interface DashboardStats {
  totalEggsToday: number;
  totalEggsThisWeek: number;
  totalEggsThisMonth: number;
  totalSalesToday: number;
  totalSalesThisMonth: number;
  mortalityThisWeek: number;
  activeFarmsCount: number;
  totalUsersCount: number;
  totalInvoicesCount: number;
  farmStats: Array<{
    farmId: string;
    farmName: string;
    eggsToday: number;
    currentStock: number;
  }>;
}

export const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export const productionFormSchema = z.object({
  farmId: z.string().min(1, "انتخاب فارم الزامی است"),
  date: z.string().min(1, "تاریخ الزامی است"),
  eggCount: z.number().min(0, "تعداد تخم‌مرغ نمی‌تواند منفی باشد"),
  brokenEggs: z.number().min(0, "تعداد تخم‌مرغ شکسته نمی‌تواند منفی باشد"),
  mortality: z.number().min(0, "تلفات نمی‌تواند منفی باشد"),
  feedConsumption: z.number().min(0, "مصرف دان نمی‌تواند منفی باشد"),
  waterConsumption: z.number().min(0, "مصرف آب نمی‌تواند منفی باشد"),
  yesterdayInventory: z.number().min(0, "موجودی دیروز نمی‌تواند منفی باشد").optional(),
  notes: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  farmId: z.string().min(1, "انتخاب فارم الزامی است"),
  productId: z.string().optional(),
  date: z.string().min(1, "تاریخ الزامی است"),
  customerName: z.string().min(1, "نام مشتری الزامی است"),
  customerPhone: z.string().optional(),
  quantity: z.number().min(1, "تعداد باید حداقل ۱ باشد"),
  weight: z.number().min(0, "وزن نمی‌تواند منفی باشد").optional(),
  pricePerUnit: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
});

export const farmFormSchema = z.object({
  name: z.string().min(1, "نام فارم الزامی است"),
  totalBirds: z.number().min(0, "تعداد پرندگان نمی‌تواند منفی باشد").optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const userFormSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
  fullName: z.string().min(1, "نام کامل الزامی است"),
  role: z.enum(["admin", "recording_officer", "sales_officer"]),
  assignedFarmId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const productFormSchema = z.object({
  name: z.string().min(1, "نام محصول الزامی است"),
  description: z.string().optional(),
  unit: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type ProductionForm = z.infer<typeof productionFormSchema>;
export type InvoiceForm = z.infer<typeof invoiceFormSchema>;
export type FarmForm = z.infer<typeof farmFormSchema>;
export type UserForm = z.infer<typeof userFormSchema>;
export type ProductForm = z.infer<typeof productFormSchema>;

export const getRoleName = (role: UserRole): string => {
  switch (role) {
    case "admin": return "مدیر سیستم";
    case "recording_officer": return "مسئول ثبت";
    case "sales_officer": return "مسئول فروش";
    default: return role;
  }
};
