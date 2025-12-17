import { 
  type User, type InsertUser,
  type ProductionRecord, type ProductionForm,
  type SalesInvoice, type InvoiceForm,
  type Inventory,
  type DashboardStats,
  type Farm, type InsertFarm,
  type Product, type InsertProduct,
  users, productionRecords, salesInvoices, inventory, farms, products
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";
import jalaali from "jalaali-js";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  getFarms(): Promise<Farm[]>;
  getActiveFarms(): Promise<Farm[]>;
  getFarm(id: string): Promise<Farm | undefined>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: string, data: Partial<InsertFarm>): Promise<Farm | undefined>;
  deleteFarm(id: string): Promise<boolean>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  getProductionRecords(): Promise<ProductionRecord[]>;
  getProductionRecordsByFarm(farmId: string): Promise<ProductionRecord[]>;
  getProductionRecordsByDate(date: string): Promise<ProductionRecord[]>;
  getProductionRecord(id: string): Promise<ProductionRecord | undefined>;
  createProductionRecord(record: ProductionForm & { userId?: string; createdTime?: string }): Promise<ProductionRecord>;
  updateProductionRecord(id: string, data: Partial<ProductionForm>): Promise<ProductionRecord | undefined>;
  deleteProductionRecord(id: string): Promise<boolean>;
  
  getInvoices(): Promise<SalesInvoice[]>;
  getInvoicesByFarm(farmId: string): Promise<SalesInvoice[]>;
  getInvoicesByDate(date: string): Promise<SalesInvoice[]>;
  getRecentInvoices(limit: number): Promise<SalesInvoice[]>;
  getInvoice(id: string): Promise<SalesInvoice | undefined>;
  createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number; userId?: string; createdTime?: string }): Promise<SalesInvoice>;
  updateInvoice(id: string, data: Partial<InvoiceForm>): Promise<SalesInvoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  getInventory(farmId: string): Promise<Inventory | undefined>;
  updateInventory(farmId: string, eggChange: number): Promise<Inventory>;
  
  getDashboardStats(): Promise<DashboardStats>;
  generateInvoiceNumber(): string;
}

class DatabaseStorage implements IStorage {
  private invoiceCounter: number = 1000;

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getFarms(): Promise<Farm[]> {
    return await db.select().from(farms).orderBy(desc(farms.createdAt));
  }

  async getActiveFarms(): Promise<Farm[]> {
    return await db.select().from(farms).where(eq(farms.isActive, true)).orderBy(desc(farms.createdAt));
  }

  async getFarm(id: string): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.id, id));
    return farm;
  }

  async createFarm(insertFarm: InsertFarm): Promise<Farm> {
    const [farm] = await db.insert(farms).values(insertFarm).returning();
    return farm;
  }

  async updateFarm(id: string, data: Partial<InsertFarm>): Promise<Farm | undefined> {
    const [farm] = await db.update(farms).set({ ...data, updatedAt: new Date() }).where(eq(farms.id, id)).returning();
    return farm;
  }

  async deleteFarm(id: string): Promise<boolean> {
    await db.delete(farms).where(eq(farms.id, id));
    return true;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async getProductionRecords(): Promise<ProductionRecord[]> {
    return await db.select().from(productionRecords).orderBy(desc(productionRecords.date));
  }

  async getProductionRecordsByFarm(farmId: string): Promise<ProductionRecord[]> {
    return await db.select().from(productionRecords).where(eq(productionRecords.farmId, farmId)).orderBy(desc(productionRecords.date));
  }

  async getProductionRecordsByDate(date: string): Promise<ProductionRecord[]> {
    return await db.select().from(productionRecords).where(eq(productionRecords.date, date)).orderBy(desc(productionRecords.createdAt));
  }

  async getProductionRecord(id: string): Promise<ProductionRecord | undefined> {
    const [record] = await db.select().from(productionRecords).where(eq(productionRecords.id, id));
    return record;
  }

  async createProductionRecord(record: ProductionForm & { userId?: string; createdTime?: string }): Promise<ProductionRecord> {
    const farm = await this.getFarm(record.farmId);
    if (!farm || !farm.isActive) {
      throw new Error("فارم انتخاب شده فعال نیست");
    }
    
    const [newRecord] = await db.insert(productionRecords).values({
      ...record,
      createdTime: record.createdTime || new Date().toLocaleTimeString('fa-IR'),
    }).returning();
    
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmId, netEggs);
    
    return newRecord;
  }

  async updateProductionRecord(id: string, data: Partial<ProductionForm>): Promise<ProductionRecord | undefined> {
    const [record] = await db.update(productionRecords).set(data).where(eq(productionRecords.id, id)).returning();
    return record;
  }

  async deleteProductionRecord(id: string): Promise<boolean> {
    const record = await this.getProductionRecord(id);
    if (!record) return false;
    
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmId, -netEggs);
    
    await db.delete(productionRecords).where(eq(productionRecords.id, id));
    return true;
  }

  async getInvoices(): Promise<SalesInvoice[]> {
    return await db.select().from(salesInvoices).orderBy(desc(salesInvoices.date));
  }

  async getInvoicesByFarm(farmId: string): Promise<SalesInvoice[]> {
    return await db.select().from(salesInvoices).where(eq(salesInvoices.farmId, farmId)).orderBy(desc(salesInvoices.date));
  }

  async getInvoicesByDate(date: string): Promise<SalesInvoice[]> {
    return await db.select().from(salesInvoices).where(eq(salesInvoices.date, date)).orderBy(desc(salesInvoices.createdAt));
  }

  async getRecentInvoices(limit: number): Promise<SalesInvoice[]> {
    return await db.select().from(salesInvoices).orderBy(desc(salesInvoices.createdAt)).limit(limit);
  }

  async getInvoice(id: string): Promise<SalesInvoice | undefined> {
    const [invoice] = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number; userId?: string; createdTime?: string }): Promise<SalesInvoice> {
    const farm = await this.getFarm(invoice.farmId);
    if (!farm || !farm.isActive) {
      throw new Error("فارم انتخاب شده فعال نیست");
    }
    
    const [newInvoice] = await db.insert(salesInvoices).values({
      ...invoice,
      createdTime: invoice.createdTime || new Date().toLocaleTimeString('fa-IR'),
    }).returning();
    
    await this.updateInventory(invoice.farmId, -invoice.quantity);
    
    return newInvoice;
  }

  async updateInvoice(id: string, data: Partial<InvoiceForm>): Promise<SalesInvoice | undefined> {
    const [invoice] = await db.update(salesInvoices).set(data).where(eq(salesInvoices.id, id)).returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return false;
    
    await this.updateInventory(invoice.farmId, invoice.quantity);
    
    await db.delete(salesInvoices).where(eq(salesInvoices.id, id));
    return true;
  }

  async getInventory(farmId: string): Promise<Inventory | undefined> {
    const [inv] = await db.select().from(inventory).where(eq(inventory.farmId, farmId));
    return inv;
  }

  async updateInventory(farmId: string, eggChange: number): Promise<Inventory> {
    const inv = await this.getInventory(farmId);
    
    if (!inv) {
      const [newInv] = await db.insert(inventory).values({
        farmId,
        currentEggStock: Math.max(0, eggChange),
      }).returning();
      return newInv;
    }
    
    const newStock = Math.max(0, inv.currentEggStock + eggChange);
    const [updated] = await db.update(inventory)
      .set({ currentEggStock: newStock, lastUpdated: new Date() })
      .where(eq(inventory.id, inv.id))
      .returning();
    
    return updated;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const today = this.getTodayJalali();
    const weekAgo = this.getDateDaysAgo(7);
    const monthAgo = this.getDateDaysAgo(30);
    
    const records = await db.select().from(productionRecords);
    const invoicesArr = await db.select().from(salesInvoices);
    const allFarms = await db.select().from(farms);
    const allUsers = await db.select().from(users);
    const activeFarms = allFarms.filter(f => f.isActive);
    
    const todayRecords = records.filter(r => r.date === today);
    const totalEggsToday = todayRecords.reduce((sum, r) => sum + r.eggCount, 0);
    
    const weekRecords = records.filter(r => r.date >= weekAgo);
    const totalEggsThisWeek = weekRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const mortalityThisWeek = weekRecords.reduce((sum, r) => sum + r.mortality, 0);
    
    const monthRecords = records.filter(r => r.date >= monthAgo);
    const totalEggsThisMonth = monthRecords.reduce((sum, r) => sum + r.eggCount, 0);
    
    const todayInvoices = invoicesArr.filter(i => i.date === today);
    const totalSalesToday = todayInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const monthInvoices = invoicesArr.filter(i => i.date >= monthAgo);
    const totalSalesThisMonth = monthInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const farmStats = await Promise.all(activeFarms.map(async (farm) => {
      const farmTodayRecords = todayRecords.filter(r => r.farmId === farm.id);
      const eggsToday = farmTodayRecords.reduce((sum, r) => sum + r.eggCount, 0);
      const inv = await this.getInventory(farm.id);
      return {
        farmId: farm.id,
        farmName: farm.name,
        eggsToday,
        currentStock: inv?.currentEggStock || 0,
      };
    }));
    
    return {
      totalEggsToday,
      totalEggsThisWeek,
      totalEggsThisMonth,
      totalSalesToday,
      totalSalesThisMonth,
      mortalityThisWeek,
      activeFarmsCount: activeFarms.length,
      totalUsersCount: allUsers.length,
      totalInvoicesCount: invoicesArr.length,
      farmStats,
    };
  }

  private getTodayJalali(): string {
    const date = new Date();
    const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
  }

  generateInvoiceNumber(): string {
    this.invoiceCounter++;
    return `INV-${Date.now()}-${this.invoiceCounter}`;
  }
}

export const storage = new DatabaseStorage();
