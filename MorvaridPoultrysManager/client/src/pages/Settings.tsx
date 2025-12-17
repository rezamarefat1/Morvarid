import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Moon,
  Fingerprint,
  Bell,
  Download,
  Upload,
  Trash2,
  LogOut,
  User,
  Shield,
  Database,
  HelpCircle,
  Info,
  Smartphone,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user, logout, isBiometricAvailable } = useAuth();
  const { toast } = useToast();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleEnableBiometric = async () => {
    if (!isBiometricAvailable) {
      toast({
        title: "پشتیبانی نمی‌شود",
        description: "دستگاه شما از احراز هویت بیومتریک پشتیبانی نمی‌کند",
        variant: "destructive",
      });
      return;
    }

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "مرغداری مروارید",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user?.id || "user"),
            name: user?.username || "user",
            displayName: user?.fullName || "کاربر",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      if (credential) {
        localStorage.setItem("morvarid_biometric_user", JSON.stringify(user));
        setBiometricEnabled(true);
        toast({
          title: "فعال شد",
          description: "ورود با اثر انگشت فعال شد",
        });
      }
    } catch {
      toast({
        title: "خطا",
        description: "فعال‌سازی بیومتریک انجام نشد",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    const data = {
      productionRecords: JSON.parse(localStorage.getItem("morvarid_production") || "[]"),
      invoices: JSON.parse(localStorage.getItem("morvarid_invoices") || "[]"),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `morvarid-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "پشتیبان‌گیری انجام شد",
      description: "فایل پشتیبان دانلود شد",
    });
  };

  const handleClearData = () => {
    localStorage.removeItem("morvarid_production");
    localStorage.removeItem("morvarid_invoices");
    toast({
      title: "پاک شد",
      description: "تمام داده‌ها حذف شدند",
    });
    window.location.reload();
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">تنظیمات</h1>
        <p className="text-muted-foreground">مدیریت حساب کاربری و تنظیمات برنامه</p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              حساب کاربری
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{user?.fullName || "کاربر"}</p>
                <p className="text-sm text-muted-foreground">{user?.username}</p>
              </div>
              <Button variant="outline" onClick={logout} data-testid="button-logout-settings">
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              ظاهر برنامه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">حالت شب</p>
                  <p className="text-sm text-muted-foreground">تغییر تم به حالت تاریک</p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5" />
              امنیت
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">ورود با اثر انگشت</p>
                  <p className="text-sm text-muted-foreground">
                    {isBiometricAvailable ? "استفاده از بیومتریک برای ورود سریع" : "دستگاه شما پشتیبانی نمی‌کند"}
                  </p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={(checked) => {
                  if (checked) handleEnableBiometric();
                  else setBiometricEnabled(false);
                }}
                disabled={!isBiometricAvailable}
                data-testid="switch-biometric"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">اعلان‌ها</p>
                  <p className="text-sm text-muted-foreground">دریافت یادآوری‌ها و اعلان‌ها</p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                data-testid="switch-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="w-5 h-5" />
              داده‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">پشتیبان‌گیری</p>
                  <p className="text-sm text-muted-foreground">دانلود کپی از تمام داده‌ها</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData} data-testid="button-backup">
                دانلود
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">پاک‌سازی داده‌ها</p>
                  <p className="text-sm text-muted-foreground">حذف تمام داده‌های ذخیره شده</p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" data-testid="button-clear-data">
                    پاک‌سازی
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      این عملیات تمام داده‌های شما را حذف خواهد کرد و قابل بازگشت نیست.
                      لطفاً قبل از ادامه از داده‌های خود پشتیبان بگیرید.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      بله، حذف کن
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="w-5 h-5" />
              درباره برنامه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">نسخه</span>
                <span>۱.۰.۰</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">توسعه‌دهنده</span>
                <span>مرغداری مروارید</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">پلتفرم</span>
                <span>PWA - نسخه وب</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
