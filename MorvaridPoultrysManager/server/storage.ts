import { 
  type User, type InsertUser,
  type ProductionRecord, type ProductionForm,
  type SalesInvoice, type InvoiceForm,
  type Inventory,
  type DashboardStats, type FarmType,
  users, productionRecords, salesInvoices, inventory
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, sql } from "drizzle-orm";
import jalaali from "jalaali-js";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProductionRecords(): Promise<ProductionRecord[]>;
  getProductionRecord(id: string): Promise<ProductionRecord | undefined>;
  createProductionRecord(record: ProductionForm): Promise<ProductionRecord>;
  deleteProductionRecord(id: string): Promise<boolean>;
  
  getInvoices(): Promise<SalesInvoice[]>;
  getInvoice(id: string): Promise<SalesInvoice | undefined>;
  createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number }): Promise<SalesInvoice>;
  deleteInvoice(id: string): Promise<boolean>;
  
  getInventory(farmType: FarmType): Promise<Inventory | undefined>;
  updateInventory(farmType: FarmType, eggChange: number): Promise<Inventory>;
  
  getDashboardStats(): Promise<DashboardStats>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProductionRecords(): Promise<ProductionRecord[]> {
    const records = await db.select().from(productionRecords).orderBy(sql`${productionRecords.date} DESC`);
    return records;
  }

  async getProductionRecord(id: string): Promise<ProductionRecord | undefined> {
    const [record] = await db.select().from(productionRecords).where(eq(productionRecords.id, id));
    return record;
  }

  async createProductionRecord(record: ProductionForm): Promise<ProductionRecord> {
    const [newRecord] = await db.insert(productionRecords).values(record).returning();
    
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmType, netEggs);
    
    return newRecord;
  }

  async deleteProductionRecord(id: string): Promise<boolean> {
    const record = await this.getProductionRecord(id);
    if (!record) return false;
    
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmType, -netEggs);
    
    await db.delete(productionRecords).where(eq(productionRecords.id, id));
    return true;
  }

  async getInvoices(): Promise<SalesInvoice[]> {
    const invoices = await db.select().from(salesInvoices).orderBy(sql`${salesInvoices.date} DESC`);
    return invoices;
  }

  async getInvoice(id: string): Promise<SalesInvoice | undefined> {
    const [invoice] = await db.select().from(salesInvoices).where(eq(salesInvoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number }): Promise<SalesInvoice> {
    const [newInvoice] = await db.insert(salesInvoices).values(invoice).returning();
    
    await this.updateInventory(invoice.farmType, -invoice.eggQuantity);
    
    return newInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return false;
    
    await this.updateInventory(invoice.farmType, invoice.eggQuantity);
    
    await db.delete(salesInvoices).where(eq(salesInvoices.id, id));
    return true;
  }

  async getInventory(farmType: FarmType): Promise<Inventory | undefined> {
    const [inv] = await db.select().from(inventory).where(eq(inventory.farmType, farmType));
    return inv;
  }

  async updateInventory(farmType: FarmType, eggChange: number): Promise<Inventory> {
    const inv = await this.getInventory(farmType);
    
    if (!inv) {
      const [newInv] = await db.insert(inventory).values({
        farmType,
        currentEggStock: Math.max(0, eggChange),
        totalBirds: farmType === "morvaridi" ? 5000 : 3000,
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
    
    const todayRecords = records.filter(r => r.date === today);
    const totalEggsToday = todayRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const morvaridiEggsToday = todayRecords
      .filter(r => r.farmType === "morvaridi")
      .reduce((sum, r) => sum + r.eggCount, 0);
    const motafarreqeEggsToday = todayRecords
      .filter(r => r.farmType === "motafarreqe")
      .reduce((sum, r) => sum + r.eggCount, 0);
    
    const weekRecords = records.filter(r => r.date >= weekAgo);
    const totalEggsThisWeek = weekRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const mortalityThisWeek = weekRecords.reduce((sum, r) => sum + r.mortality, 0);
    
    const monthRecords = records.filter(r => r.date >= monthAgo);
    const totalEggsThisMonth = monthRecords.reduce((sum, r) => sum + r.eggCount, 0);
    
    const todayInvoices = invoicesArr.filter(i => i.date === today);
    const totalSalesToday = todayInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const monthInvoices = invoicesArr.filter(i => i.date >= monthAgo);
    const totalSalesThisMonth = monthInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const morvaridiInv = await this.getInventory("morvaridi");
    const motafarreqeInv = await this.getInventory("motafarreqe");
    
    return {
      totalEggsToday,
      totalEggsThisWeek,
      totalEggsThisMonth,
      morvaridiEggsToday,
      motafarreqeEggsToday,
      totalSalesToday,
      totalSalesThisMonth,
      mortalityThisWeek,
      currentInventory: {
        morvaridi: morvaridiInv?.currentEggStock || 0,
        motafarreqe: motafarreqeInv?.currentEggStock || 0,
      },
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
    return `INV-${this.invoiceCounter}`;
  }
}

export const storage = new DatabaseStorage();
