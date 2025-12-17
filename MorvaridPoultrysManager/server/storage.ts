import { 
  type User, type InsertUser,
  type ProductionRecord, type ProductionForm,
  type SalesInvoice, type InvoiceForm,
  type Inventory,
  type DashboardStats, type FarmType
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Production Records
  getProductionRecords(): Promise<ProductionRecord[]>;
  getProductionRecord(id: string): Promise<ProductionRecord | undefined>;
  createProductionRecord(record: ProductionForm): Promise<ProductionRecord>;
  deleteProductionRecord(id: string): Promise<boolean>;
  
  // Sales Invoices
  getInvoices(): Promise<SalesInvoice[]>;
  getInvoice(id: string): Promise<SalesInvoice | undefined>;
  createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number }): Promise<SalesInvoice>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Inventory
  getInventory(farmType: FarmType): Promise<Inventory | undefined>;
  updateInventory(farmType: FarmType, eggChange: number): Promise<Inventory>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private productionRecords: Map<string, ProductionRecord>;
  private invoices: Map<string, SalesInvoice>;
  private inventory: Map<FarmType, Inventory>;
  private invoiceCounter: number;

  constructor() {
    this.users = new Map();
    this.productionRecords = new Map();
    this.invoices = new Map();
    this.inventory = new Map();
    this.invoiceCounter = 1000;
    
    // Create default admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123",
      fullName: "مدیر سیستم",
      biometricEnabled: false,
      biometricCredentialId: null,
    });
    
    // Initialize inventory for both farms
    const morvaridiId = randomUUID();
    this.inventory.set("morvaridi", {
      id: morvaridiId,
      farmType: "morvaridi",
      currentEggStock: 0,
      totalBirds: 5000,
      lastUpdated: new Date(),
    });
    
    const motafarreqeId = randomUUID();
    this.inventory.set("motafarreqe", {
      id: motafarreqeId,
      farmType: "motafarreqe",
      currentEggStock: 0,
      totalBirds: 3000,
      lastUpdated: new Date(),
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      biometricEnabled: false,
      biometricCredentialId: null,
    };
    this.users.set(id, user);
    return user;
  }

  // Production Records
  async getProductionRecords(): Promise<ProductionRecord[]> {
    return Array.from(this.productionRecords.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getProductionRecord(id: string): Promise<ProductionRecord | undefined> {
    return this.productionRecords.get(id);
  }

  async createProductionRecord(record: ProductionForm): Promise<ProductionRecord> {
    const id = randomUUID();
    const newRecord: ProductionRecord = {
      ...record,
      id,
      createdAt: new Date(),
    };
    this.productionRecords.set(id, newRecord);
    
    // Update inventory: add eggs (minus broken)
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmType, netEggs);
    
    return newRecord;
  }

  async deleteProductionRecord(id: string): Promise<boolean> {
    const record = this.productionRecords.get(id);
    if (!record) return false;
    
    // Reverse inventory change
    const netEggs = record.eggCount - record.brokenEggs;
    await this.updateInventory(record.farmType, -netEggs);
    
    return this.productionRecords.delete(id);
  }

  // Sales Invoices
  async getInvoices(): Promise<SalesInvoice[]> {
    return Array.from(this.invoices.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async getInvoice(id: string): Promise<SalesInvoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InvoiceForm & { invoiceNumber: string; totalPrice: number }): Promise<SalesInvoice> {
    const id = randomUUID();
    const newInvoice: SalesInvoice = {
      ...invoice,
      id,
      createdAt: new Date(),
    };
    this.invoices.set(id, newInvoice);
    
    // Update inventory: subtract sold eggs
    await this.updateInventory(invoice.farmType, -invoice.eggQuantity);
    
    return newInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const invoice = this.invoices.get(id);
    if (!invoice) return false;
    
    // Reverse inventory change
    await this.updateInventory(invoice.farmType, invoice.eggQuantity);
    
    return this.invoices.delete(id);
  }

  // Inventory
  async getInventory(farmType: FarmType): Promise<Inventory | undefined> {
    return this.inventory.get(farmType);
  }

  async updateInventory(farmType: FarmType, eggChange: number): Promise<Inventory> {
    const inv = this.inventory.get(farmType);
    if (!inv) {
      const id = randomUUID();
      const newInv: Inventory = {
        id,
        farmType,
        currentEggStock: Math.max(0, eggChange),
        totalBirds: 0,
        lastUpdated: new Date(),
      };
      this.inventory.set(farmType, newInv);
      return newInv;
    }
    
    inv.currentEggStock = Math.max(0, inv.currentEggStock + eggChange);
    inv.lastUpdated = new Date();
    return inv;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const today = this.getTodayJalali();
    const records = Array.from(this.productionRecords.values());
    const invoicesArr = Array.from(this.invoices.values());
    
    // Today's stats
    const todayRecords = records.filter(r => r.date === today);
    const totalEggsToday = todayRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const morvaridiEggsToday = todayRecords
      .filter(r => r.farmType === "morvaridi")
      .reduce((sum, r) => sum + r.eggCount, 0);
    const motafarreqeEggsToday = todayRecords
      .filter(r => r.farmType === "motafarreqe")
      .reduce((sum, r) => sum + r.eggCount, 0);
    
    // Weekly stats (last 7 days)
    const weekAgo = this.getDateDaysAgo(7);
    const weekRecords = records.filter(r => r.date >= weekAgo);
    const totalEggsThisWeek = weekRecords.reduce((sum, r) => sum + r.eggCount, 0);
    const mortalityThisWeek = weekRecords.reduce((sum, r) => sum + r.mortality, 0);
    
    // Monthly stats (last 30 days)
    const monthAgo = this.getDateDaysAgo(30);
    const monthRecords = records.filter(r => r.date >= monthAgo);
    const totalEggsThisMonth = monthRecords.reduce((sum, r) => sum + r.eggCount, 0);
    
    // Sales stats
    const todayInvoices = invoicesArr.filter(i => i.date === today);
    const totalSalesToday = todayInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const monthInvoices = invoicesArr.filter(i => i.date >= monthAgo);
    const totalSalesThisMonth = monthInvoices.reduce((sum, i) => sum + i.totalPrice, 0);
    
    // Inventory
    const morvaridiInv = this.inventory.get("morvaridi");
    const motafarreqeInv = this.inventory.get("motafarreqe");
    
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
    const jalaali = require("jalaali-js");
    const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const jalaali = require("jalaali-js");
    const { jy, jm, jd } = jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
  }

  generateInvoiceNumber(): string {
    this.invoiceCounter++;
    return `INV-${this.invoiceCounter}`;
  }
}

export const storage = new MemStorage();
