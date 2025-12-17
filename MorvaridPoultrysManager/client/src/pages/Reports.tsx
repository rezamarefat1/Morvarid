import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FarmSelector } from "@/components/FarmSelector";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatCurrency, getTodayJalali } from "@/lib/jalali";
import { exportInvoicesToExcel } from "@/lib/excel";
import { Download, Egg, ShoppingCart, Search, BarChart3, FileText } from "lucide-react";
import type { ProductionRecord, SalesInvoice, Farm } from "@shared/schema";

export default function Reports() {
  const [reportType, setReportType] = useState<"stats" | "invoices">("stats");
  const [selectedFarmId, setSelectedFarmId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(getTodayJalali());
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const { data: farms } = useQuery<Farm[]>({
    queryKey: ["/api/farms/active"],
  });

  const { data: productionRecords, isLoading: isLoadingProduction, refetch: refetchProduction } = useQuery<ProductionRecord[]>({
    queryKey: ["/api/production"],
    enabled: false,
  });

  const { data: invoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery<SalesInvoice[]>({
    queryKey: ["/api/invoices"],
    enabled: false,
  });

  const handleShowResults = () => {
    setShowResults(true);
    if (reportType === "stats") {
      refetchProduction();
    } else {
      refetchInvoices();
    }
  };

  const filteredProduction = productionRecords?.filter(r => {
    if (selectedFarmId && r.farmId !== selectedFarmId) return false;
    if (selectedDate && r.date !== selectedDate) return false;
    return true;
  }) || [];

  const filteredInvoices = invoices?.filter(i => {
    if (selectedFarmId && i.farmId !== selectedFarmId) return false;
    if (selectedDate && i.date !== selectedDate) return false;
    return true;
  }) || [];

  const productionSummary = {
    totalEggs: filteredProduction.reduce((sum, r) => sum + r.eggCount, 0),
    totalBroken: filteredProduction.reduce((sum, r) => sum + r.brokenEggs, 0),
    totalMortality: filteredProduction.reduce((sum, r) => sum + r.mortality, 0),
    totalFeed: filteredProduction.reduce((sum, r) => sum + r.feedConsumption, 0),
    recordCount: filteredProduction.length,
  };

  const salesSummary = {
    totalSales: filteredInvoices.reduce((sum, i) => sum + i.totalPrice, 0),
    totalQuantity: filteredInvoices.reduce((sum, i) => sum + i.quantity, 0),
    paidCount: filteredInvoices.filter((i) => i.isPaid).length,
    unpaidCount: filteredInvoices.filter((i) => !i.isPaid).length,
    invoiceCount: filteredInvoices.length,
  };

  const getFarmName = (farmId: string) => {
    return farms?.find(f => f.id === farmId)?.name || "نامشخص";
  };

  const handleExportSales = () => {
    if (filteredInvoices.length) {
      const excelData = filteredInvoices.map(inv => ({
        ...inv,
        farmType: getFarmName(inv.farmId) as any,
        eggQuantity: inv.quantity,
      }));
      exportInvoicesToExcel(excelData, `گزارش-${selectedDate}`);
      toast({
        title: "دانلود شد",
        description: "گزارش فروش با موفقیت دانلود شد",
      });
    }
  };

  const isLoading = reportType === "stats" ? isLoadingProduction : isLoadingInvoices;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">گزارشات ثبت شده</h1>
        <p className="text-muted-foreground">مشاهده گزارش‌های تولید و فروش</p>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">فیلتر گزارشات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">نوع گزارش</label>
            <Tabs value={reportType} onValueChange={(v) => {
              setReportType(v as "stats" | "invoices");
              setShowResults(false);
            }}>
              <TabsList className="w-full">
                <TabsTrigger value="stats" className="flex-1 gap-2">
                  <BarChart3 className="w-4 h-4" />
                  آمار تولید
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex-1 gap-2">
                  <FileText className="w-4 h-4" />
                  حواله‌های فروش
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">انتخاب فارم</label>
            <FarmSelector
              value={selectedFarmId}
              onChange={(v) => {
                setSelectedFarmId(v);
                setShowResults(false);
              }}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">تاریخ</label>
            <JalaliDatePicker
              value={selectedDate}
              onChange={(v) => {
                setSelectedDate(v);
                setShowResults(false);
              }}
            />
          </div>

          <Button onClick={handleShowResults} className="w-full" disabled={!selectedFarmId}>
            <Search className="w-4 h-4 ml-2" />
            نمایش گزارش
          </Button>
        </CardContent>
      </Card>

      {showResults && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : reportType === "stats" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Egg className="w-5 h-5" />
                  آمار تولید - {selectedDate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredProduction.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    هیچ رکوردی برای این تاریخ یافت نشد
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(productionSummary.totalEggs)}</p>
                        <p className="text-sm text-muted-foreground">کل تولید</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(productionSummary.totalBroken)}</p>
                        <p className="text-sm text-muted-foreground">شکسته</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(productionSummary.totalMortality)}</p>
                        <p className="text-sm text-muted-foreground">تلفات</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(productionSummary.totalFeed)}</p>
                        <p className="text-sm text-muted-foreground">دان (کیلو)</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {filteredProduction.map((record) => (
                        <div key={record.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              {getFarmName(record.farmId)}
                            </span>
                            <span className="text-sm text-muted-foreground">{record.date}</span>
                            {record.createdTime && (
                              <span className="text-xs text-muted-foreground">ساعت {record.createdTime}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">تولید: </span>
                              <span className="font-semibold">{formatNumber(record.eggCount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">شکسته: </span>
                              <span className="font-semibold">{formatNumber(record.brokenEggs)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">تلفات: </span>
                              <span className="font-semibold">{formatNumber(record.mortality)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">دان: </span>
                              <span className="font-semibold">{formatNumber(record.feedConsumption)} کیلو</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  حواله‌های فروش - {selectedDate}
                </CardTitle>
                {filteredInvoices.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleExportSales}>
                    <Download className="w-4 h-4 ml-1" />
                    اکسل
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!filteredInvoices.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    هیچ حواله‌ای برای این تاریخ یافت نشد
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(salesSummary.invoiceCount)}</p>
                        <p className="text-sm text-muted-foreground">تعداد حواله</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold">{formatNumber(salesSummary.totalQuantity)}</p>
                        <p className="text-sm text-muted-foreground">تعداد فروش</p>
                      </div>
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatNumber(salesSummary.paidCount)}</p>
                        <p className="text-sm text-muted-foreground">پرداخت شده</p>
                      </div>
                      <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatNumber(salesSummary.unpaidCount)}</p>
                        <p className="text-sm text-muted-foreground">پرداخت نشده</p>
                      </div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">جمع کل فروش:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(salesSummary.totalSales)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {filteredInvoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-semibold">{invoice.invoiceNumber}</span>
                              <span className="mx-2">-</span>
                              <span>{invoice.customerName}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              invoice.isPaid 
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            }`}>
                              {invoice.isPaid ? "پرداخت شده" : "پرداخت نشده"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">تاریخ: </span>
                              <span>{invoice.date}</span>
                            </div>
                            {invoice.createdTime && (
                              <div>
                                <span className="text-muted-foreground">ساعت: </span>
                                <span>{invoice.createdTime}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">تعداد: </span>
                              <span className="font-semibold">{formatNumber(invoice.quantity)}</span>
                            </div>
                            {invoice.weight && (
                              <div>
                                <span className="text-muted-foreground">وزن: </span>
                                <span>{formatNumber(invoice.weight)} کیلو</span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">مبلغ: </span>
                              <span className="font-bold text-primary">{formatCurrency(invoice.totalPrice)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
