import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FarmSelector } from "@/components/FarmSelector";
import { useToast } from "@/hooks/use-toast";
import { formatNumber, formatCurrency, getTodayJalali } from "@/lib/jalali";
import { exportProductionToExcel, exportInvoicesToExcel } from "@/lib/excel";
import { Download, FileSpreadsheet, Egg, ShoppingCart, TrendingUp, Calendar } from "lucide-react";
import type { ProductionRecord, SalesInvoice, FarmType } from "@shared/schema";

export default function Reports() {
  const [selectedFarm, setSelectedFarm] = useState<FarmType | "all">("all");
  const { toast } = useToast();

  const { data: productionRecords, isLoading: isLoadingProduction } = useQuery<ProductionRecord[]>({
    queryKey: ["/api/production"],
  });

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery<SalesInvoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredProduction = productionRecords?.filter(
    (r) => selectedFarm === "all" || r.farmType === selectedFarm
  ) || [];

  const filteredInvoices = invoices?.filter(
    (i) => selectedFarm === "all" || i.farmType === selectedFarm
  ) || [];

  const productionSummary = {
    totalEggs: filteredProduction.reduce((sum, r) => sum + r.eggCount, 0),
    totalBroken: filteredProduction.reduce((sum, r) => sum + r.brokenEggs, 0),
    totalMortality: filteredProduction.reduce((sum, r) => sum + r.mortality, 0),
    totalFeed: filteredProduction.reduce((sum, r) => sum + r.feedConsumption, 0),
    recordCount: filteredProduction.length,
  };

  const salesSummary = {
    totalSales: filteredInvoices.reduce((sum, i) => sum + i.totalPrice, 0),
    totalQuantity: filteredInvoices.reduce((sum, i) => sum + i.eggQuantity, 0),
    paidCount: filteredInvoices.filter((i) => i.isPaid).length,
    unpaidCount: filteredInvoices.filter((i) => !i.isPaid).length,
    invoiceCount: filteredInvoices.length,
  };

  const handleExportProduction = () => {
    if (filteredProduction.length) {
      exportProductionToExcel(filteredProduction, `گزارش-تولید-${getTodayJalali()}`);
      toast({
        title: "دانلود شد",
        description: "گزارش تولید با موفقیت دانلود شد",
      });
    }
  };

  const handleExportSales = () => {
    if (filteredInvoices.length) {
      exportInvoicesToExcel(filteredInvoices, `گزارش-فروش-${getTodayJalali()}`);
      toast({
        title: "دانلود شد",
        description: "گزارش فروش با موفقیت دانلود شد",
      });
    }
  };

  const isLoading = isLoadingProduction || isLoadingInvoices;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">گزارش‌ها</h1>
        <p className="text-muted-foreground">مشاهده و دانلود گزارش‌های تولید و فروش</p>
      </header>

      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">فیلتر بر اساس فارم</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFarm("all")}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all font-medium text-sm ${
              selectedFarm === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
            data-testid="button-filter-all"
          >
            همه
          </button>
          <button
            onClick={() => setSelectedFarm("morvaridi")}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all font-medium text-sm ${
              selectedFarm === "morvaridi"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
            data-testid="button-filter-morvaridi"
          >
            مرواریدی
          </button>
          <button
            onClick={() => setSelectedFarm("motafarreqe")}
            className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all font-medium text-sm ${
              selectedFarm === "motafarreqe"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
            data-testid="button-filter-motafarreqe"
          >
            متفرقه
          </button>
        </div>
      </div>

      <Tabs defaultValue="production" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="production" data-testid="tab-production">
            <Egg className="w-4 h-4 ml-2" />
            گزارش تولید
          </TabsTrigger>
          <TabsTrigger value="sales" data-testid="tab-sales">
            <ShoppingCart className="w-4 h-4 ml-2" />
            گزارش فروش
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Egg className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(productionSummary.totalEggs)}</p>
                    <p className="text-sm text-muted-foreground">کل تخم‌مرغ</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(productionSummary.totalBroken)}</p>
                    <p className="text-sm text-muted-foreground">تخم‌مرغ شکسته</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-chart-4" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(productionSummary.totalMortality)}</p>
                    <p className="text-sm text-muted-foreground">کل تلفات</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-chart-5" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(productionSummary.recordCount)}</p>
                    <p className="text-sm text-muted-foreground">تعداد رکورد</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle className="text-lg">خلاصه تولید</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportProduction}
                    disabled={!filteredProduction.length}
                    data-testid="button-export-production"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    خروجی اکسل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">کل تخم‌مرغ سالم</span>
                      <span className="font-semibold tabular-nums">
                        {formatNumber(productionSummary.totalEggs - productionSummary.totalBroken)} عدد
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">درصد شکستگی</span>
                      <span className="font-semibold tabular-nums">
                        {productionSummary.totalEggs > 0
                          ? ((productionSummary.totalBroken / productionSummary.totalEggs) * 100).toFixed(2)
                          : "0"}%
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">کل مصرف دان</span>
                      <span className="font-semibold tabular-nums">
                        {formatNumber(productionSummary.totalFeed)} کیلوگرم
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">میانگین تولید روزانه</span>
                      <span className="font-semibold tabular-nums">
                        {productionSummary.recordCount > 0
                          ? formatNumber(Math.round(productionSummary.totalEggs / productionSummary.recordCount))
                          : "0"} عدد
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(salesSummary.invoiceCount)}</p>
                    <p className="text-sm text-muted-foreground">تعداد حواله</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Egg className="w-8 h-8 mx-auto mb-2 text-chart-2" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(salesSummary.totalQuantity)}</p>
                    <p className="text-sm text-muted-foreground">تخم‌مرغ فروخته شده</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(salesSummary.paidCount)}</p>
                    <p className="text-sm text-muted-foreground">پرداخت شده</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-destructive" />
                    <p className="text-2xl font-bold tabular-nums">{formatNumber(salesSummary.unpaidCount)}</p>
                    <p className="text-sm text-muted-foreground">پرداخت نشده</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                  <CardTitle className="text-lg">خلاصه فروش</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSales}
                    disabled={!filteredInvoices.length}
                    data-testid="button-export-sales"
                  >
                    <Download className="w-4 h-4 ml-2" />
                    خروجی اکسل
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">کل فروش</span>
                      <span className="font-bold text-primary tabular-nums text-lg">
                        {formatCurrency(salesSummary.totalSales)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">میانگین قیمت هر تخم‌مرغ</span>
                      <span className="font-semibold tabular-nums">
                        {salesSummary.totalQuantity > 0
                          ? formatCurrency(Math.round(salesSummary.totalSales / salesSummary.totalQuantity))
                          : "0 تومان"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">مبلغ پرداخت شده</span>
                      <span className="font-semibold tabular-nums text-green-600">
                        {formatCurrency(
                          filteredInvoices.filter((i) => i.isPaid).reduce((sum, i) => sum + i.totalPrice, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">مبلغ پرداخت نشده</span>
                      <span className="font-semibold tabular-nums text-destructive">
                        {formatCurrency(
                          filteredInvoices.filter((i) => !i.isPaid).reduce((sum, i) => sum + i.totalPrice, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
