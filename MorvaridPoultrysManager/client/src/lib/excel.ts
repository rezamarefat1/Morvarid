import ExcelJS from "exceljs";
import type { ProductionRecord, SalesInvoice } from "@shared/schema";
import { formatNumber, formatCurrency } from "./jalali";

export async function exportProductionToExcel(records: ProductionRecord[], filename: string = "production-report") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "مرغداری مروارید";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("گزارش تولید", {
    views: [{ rightToLeft: true }]
  });

  worksheet.columns = [
    { header: "تاریخ", key: "date", width: 15 },
    { header: "نام فارم", key: "farmName", width: 15 },
    { header: "تعداد تخم‌مرغ", key: "eggCount", width: 15 },
    { header: "تخم‌مرغ شکسته", key: "brokenEggs", width: 15 },
    { header: "تلفات", key: "mortality", width: 12 },
    { header: "مصرف دان (کیلوگرم)", key: "feedConsumption", width: 18 },
    { header: "مصرف آب (لیتر)", key: "waterConsumption", width: 15 },
    { header: "یادداشت", key: "notes", width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF16A34A" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  records.forEach((record) => {
    worksheet.addRow({
      date: record.date,
      farmName: record.farmId, // Using farmId as placeholder; you'll need to fetch the farm name separately
      eggCount: record.eggCount,
      brokenEggs: record.brokenEggs,
      mortality: record.mortality,
      feedConsumption: record.feedConsumption,
      waterConsumption: record.waterConsumption,
      notes: record.notes || "-",
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0FDF4" },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

export async function exportInvoicesToExcel(invoices: SalesInvoice[], filename: string = "sales-report") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "مرغداری مروارید";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("گزارش فروش", {
    views: [{ rightToLeft: true }]
  });

  worksheet.columns = [
    { header: "شماره حواله", key: "invoiceNumber", width: 15 },
    { header: "تاریخ", key: "date", width: 15 },
    { header: "نام فارم", key: "farmName", width: 15 },
    { header: "نام مشتری", key: "customerName", width: 20 },
    { header: "تلفن", key: "customerPhone", width: 15 },
    { header: "تعداد", key: "quantity", width: 12 },
    { header: "قیمت واحد", key: "pricePerUnit", width: 15 },
    { header: "جمع کل", key: "totalPrice", width: 18 },
    { header: "وضعیت پرداخت", key: "isPaid", width: 15 },
  ];

  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF16A34A" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  invoices.forEach((invoice) => {
    worksheet.addRow({
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      farmName: invoice.farmId, // Using farmId as placeholder; you'll need to fetch the farm name separately
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || "-",
      quantity: invoice.quantity,
      pricePerUnit: invoice.pricePerUnit,
      totalPrice: invoice.totalPrice,
      isPaid: invoice.isPaid ? "پرداخت شده" : "پرداخت نشده",
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0FDF4" },
      };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(buffer, `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}

function downloadBlob(buffer: ArrayBuffer | ExcelJS.Buffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
