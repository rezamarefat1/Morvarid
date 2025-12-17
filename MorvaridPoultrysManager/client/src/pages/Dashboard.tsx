import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJalaliDateLong, formatNumber, formatCurrency } from "@/lib/jalali";
import { Egg, TrendingUp, Skull, ShoppingCart, Package, AlertCircle } from "lucide-react";
import type { DashboardStats } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const today = new Date();

  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
            <h3 className="font-semibold text-lg mb-2">خطا در بارگذاری اطلاعات</h3>
            <p className="text-muted-foreground">لطفاً دوباره تلاش کنید</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const defaultStats: DashboardStats = {
    totalEggsToday: 0,
    totalEggsThisWeek: 0,
    totalEggsThisMonth: 0,
    morvaridiEggsToday: 0,
    motafarreqeEggsToday: 0,
    totalSalesToday: 0,
    totalSalesThisMonth: 0,
    mortalityThisWeek: 0,
    currentInventory: { morvaridi: 0, motafarreqe: 0 },
  };

  const data = stats || defaultStats;

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">داشبورد</h1>
        <p className="text-muted-foreground">{formatJalaliDateLong(today)}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="تولید امروز"
          value={data.totalEggsToday}
          unit="عدد"
          icon={Egg}
          iconColor="text-primary"
        />
        <StatCard
          title="تولید این هفته"
          value={data.totalEggsThisWeek}
          unit="عدد"
          icon={TrendingUp}
          iconColor="text-chart-2"
        />
        <StatCard
          title="تولید این ماه"
          value={data.totalEggsThisMonth}
          unit="عدد"
          icon={Package}
          iconColor="text-chart-4"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              فارم مرواریدی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold tabular-nums">{formatNumber(data.morvaridiEggsToday)}</p>
                <p className="text-sm text-muted-foreground">تخم‌مرغ امروز</p>
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold tabular-nums">{formatNumber(data.currentInventory.morvaridi)}</p>
                <p className="text-sm text-muted-foreground">موجودی</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              فارم متفرقه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold tabular-nums">{formatNumber(data.motafarreqeEggsToday)}</p>
                <p className="text-sm text-muted-foreground">تخم‌مرغ امروز</p>
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold tabular-nums">{formatNumber(data.currentInventory.motafarreqe)}</p>
                <p className="text-sm text-muted-foreground">موجودی</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="فروش امروز"
          value={data.totalSalesToday}
          unit="تومان"
          icon={ShoppingCart}
          iconColor="text-chart-4"
        />
        <StatCard
          title="فروش این ماه"
          value={data.totalSalesThisMonth}
          unit="تومان"
          icon={TrendingUp}
          iconColor="text-chart-5"
        />
        <StatCard
          title="تلفات این هفته"
          value={data.mortalityThisWeek}
          unit="قطعه"
          icon={Skull}
          iconColor="text-destructive"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">دسترسی سریع</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/production">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="link-production">
              <Egg className="w-6 h-6" />
              <span>ثبت تولید</span>
            </Button>
          </Link>
          <Link href="/sales">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2" data-testid="link-sales">
              <ShoppingCart className="w-6 h-6" />
              <span>حواله فروش</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
