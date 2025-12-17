import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatJalaliDateLong, formatNumber, formatCurrency } from "@/lib/jalali";
import { Building2, Users, FileText, BarChart3, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { DashboardStats, Farm, User, SalesInvoice } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getRoleName } from "@shared/schema";

export default function Dashboard() {
  const today = new Date();
  const [showFarmStatus, setShowFarmStatus] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: farms } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: recentInvoices } = useQuery<SalesInvoice[]>({
    queryKey: ["/api/invoices", { limit: "7" }],
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

  const activeFarms = farms?.filter(f => f.isActive) || [];
  const inactiveFarms = farms?.filter(f => !f.isActive) || [];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">داشبورد مدیریت</h1>
        <p className="text-muted-foreground">{formatJalaliDateLong(today)}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowFarmStatus(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              وضعیت فارم‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{activeFarms.length}</span>
                <span className="text-sm text-muted-foreground">فعال</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold">{inactiveFarms.length}</span>
                <span className="text-sm text-muted-foreground">غیرفعال</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowUsers(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              کاربران سیستم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsersCount || 0}</p>
            <p className="text-sm text-muted-foreground">کاربر ثبت شده</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowInvoices(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              کل حواله‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalInvoicesCount || 0}</p>
            <p className="text-sm text-muted-foreground">حواله ثبت شده</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            گزارشات ثبت شده
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/reports">
            <Button variant="outline" className="w-full">
              مشاهده گزارشات
            </Button>
          </Link>
        </CardContent>
      </Card>


      <Dialog open={showFarmStatus} onOpenChange={setShowFarmStatus}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>وضعیت فارم‌ها</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activeFarms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  فارم‌های فعال
                </h3>
                <div className="space-y-2">
                  {activeFarms.map(farm => (
                    <div key={farm.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="font-medium">{farm.name}</p>
                      <p className="text-sm text-muted-foreground">{farm.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {inactiveFarms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  فارم‌های غیرفعال
                </h3>
                <div className="space-y-2">
                  {inactiveFarms.map(farm => (
                    <div key={farm.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                      <p className="font-medium">{farm.name}</p>
                      <p className="text-sm text-muted-foreground">{farm.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsers} onOpenChange={setShowUsers}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>کاربران سیستم</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {users?.map(user => (
              <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {getRoleName(user.role)}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInvoices} onOpenChange={setShowInvoices}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>حواله‌های اخیر</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {recentInvoices?.map(invoice => (
              <div key={invoice.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{invoice.customerName}</p>
                    <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                  </div>
                  <Badge variant={invoice.isPaid ? "default" : "secondary"}>
                    {invoice.isPaid ? "پرداخت شده" : "پرداخت نشده"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">تاریخ: </span>
                    <span>{invoice.date}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تعداد: </span>
                    <span>{formatNumber(invoice.quantity)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">مبلغ: </span>
                    <span className="font-semibold text-primary">{formatCurrency(invoice.totalPrice)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
