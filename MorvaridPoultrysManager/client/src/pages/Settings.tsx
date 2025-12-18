import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/utilities/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Moon,
  Fingerprint,
  Bell,
  Download,
  Trash2,
  LogOut,
  User,
  Shield,
  Database,
  Info,
  Smartphone,
  Building2,
  Package,
  Users,
  Plus,
  Edit2,
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
import { type Farm, type Product, type User as UserType, getRoleName } from "@shared/schema";

export default function Settings() {
  const { user, logout, isBiometricAvailable } = useAuth();
  const { toast } = useToast();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const [showFarmDialog, setShowFarmDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [farmName, setFarmName] = useState("");
  const [farmActive, setFarmActive] = useState(true);
  const [farmBirds, setFarmBirds] = useState(0);

  const [productName, setProductName] = useState("");
  const [productActive, setProductActive] = useState(true);
  const [productUnit, setProductUnit] = useState("");

  const [userName, setUserName] = useState("");
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "recording_officer" | "sales_officer">("recording_officer");
  const [userFarmId, setUserFarmId] = useState("");
  const [userActive, setUserActive] = useState(true);

  const { data: farms } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });

  const { data: allFarmsForAssignment } = useQuery<Farm[]>({
    queryKey: ["/api/farms"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createFarmMutation = useMutation({
    mutationFn: async (data: { name: string; isActive: boolean; totalBirds: number }) => {
      return apiRequest("POST", "/api/farms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      toast({ title: "ثبت شد", description: "فارم با موفقیت ایجاد شد" });
      resetFarmForm();
      setShowFarmDialog(false);
    },
  });

  const updateFarmMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Farm> }) => {
      return apiRequest("PUT", `/api/farms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      toast({ title: "ویرایش شد", description: "فارم با موفقیت ویرایش شد" });
      resetFarmForm();
      setShowFarmDialog(false);
    },
  });

  const deleteFarmMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/farms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      toast({ title: "حذف شد", description: "فارم با موفقیت حذف شد" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string | null; unit?: string | null; isActive?: boolean }) => {
      return apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "ثبت شد", description: "محصول با موفقیت ایجاد شد" });
      resetProductForm();
      setShowProductDialog(false);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      return apiRequest("PUT", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "ویرایش شد", description: "محصول با موفقیت ویرایش شد" });
      resetProductForm();
      setShowProductDialog(false);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "حذف شد", description: "محصول با موفقیت حذف شد" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "ثبت شد", description: "کاربر با موفقیت ایجاد شد" });
      resetUserForm();
      setShowUserDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "خطا", description: error.message || "خطا در ایجاد کاربر", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "ویرایش شد", description: "کاربر با موفقیت ویرایش شد" });
      resetUserForm();
      setShowUserDialog(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "حذف شد", description: "کاربر با موفقیت حذف شد" });
    },
  });

  const resetFarmForm = () => {
    setFarmName("");
    setFarmActive(true);
    setFarmBirds(0);
    setEditingFarm(null);
  };

  const resetProductForm = () => {
    setProductName("");
    setProductActive(true);
    setEditingProduct(null);
  };

  const resetUserForm = () => {
    setUserName("");
    setUserUsername("");
    setUserPassword("");
    setUserRole("recording_officer");
    setUserFarmId("");
    setUserActive(true);
    setEditingUser(null);
  };

  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setFarmName(farm.name);
    setFarmActive(farm.isActive || false);
    setFarmBirds(farm.totalBirds || 0);
    setShowFarmDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductActive(product.isActive || false);
    setProductUnit(product.unit || "");
    setShowProductDialog(true);
  };

  const handleEditUser = (u: UserType) => {
    setEditingUser(u);
    setUserName(u.fullName);
    setUserUsername(u.username);
    setUserPassword("");
    setUserRole(u.role);
    setUserFarmId(u.assignedFarmId || "");
    setUserActive(u.isActive || false);
    setShowUserDialog(true);
  };

  const handleSaveFarm = () => {
    if (editingFarm) {
      updateFarmMutation.mutate({
        id: editingFarm.id,
        data: { name: farmName, isActive: farmActive, totalBirds: farmBirds },
      });
    } else {
      createFarmMutation.mutate({ name: farmName, isActive: farmActive, totalBirds: farmBirds });
    }
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: { name: productName, isActive: productActive, unit: productUnit },
      });
    } else {
      createProductMutation.mutate({ name: productName, isActive: productActive, unit: productUnit });
    }
  };

  const handleSaveUser = () => {
    if ((userRole === "recording_officer" || userRole === "sales_officer") && !userFarmId) {
      toast({ title: "خطا", description: "تخصیص فارم برای این نقش الزامی است", variant: "destructive" });
      return;
    }

    const data: any = {
      fullName: userName,
      username: userUsername,
      role: userRole,
      assignedFarmId: userFarmId || null,
      isActive: userActive,
    };

    if (userPassword) {
      data.password = userPassword;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    } else {
      if (!userPassword) {
        toast({ title: "خطا", description: "رمز عبور الزامی است", variant: "destructive" });
        return;
      }
      data.password = userPassword;
      createUserMutation.mutate(data);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

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
          rp: { name: "مرغداری مروارید", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user?.id || "user"),
            name: user?.username || "user",
            displayName: user?.fullName || "کاربر",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      });

      if (credential) {
        localStorage.setItem("morvarid_biometric_user", JSON.stringify(user));
        setBiometricEnabled(true);
        toast({ title: "فعال شد", description: "ورود با اثر انگشت فعال شد" });
      }
    } catch {
      toast({ title: "خطا", description: "فعال‌سازی بیومتریک انجام نشد", variant: "destructive" });
    }
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
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              محصولات
            </CardTitle>
            <Dialog open={showProductDialog} onOpenChange={(open) => {
              setShowProductDialog(open);
              if (!open) resetProductForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  محصول جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "ویرایش محصول" : "ایجاد محصول جدید"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
  <label className="text-sm font-medium mb-1 block">واحد شمارش</label>
  <Select value={productUnit} onValueChange={setProductUnit}>
    <SelectTrigger>
      <SelectValue placeholder="انتخاب واحد شمارش" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="کیلوگرم">کیلوگرم</SelectItem>
      <SelectItem value="کارتن">کارتن</SelectItem>
      <SelectItem value="شانه">شانه</SelectItem>
      <SelectItem value="عدد">عدد</SelectItem>
      <SelectItem value="بسته">بسته</SelectItem>
    </SelectContent>
  </Select>
</div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">نام محصول</label>
                    <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="نام محصول" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">واحد شمارش</label>
                    <Select value={productUnit} onValueChange={setProductUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب واحد شمارش" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="کیلوگرم">کیلوگرم</SelectItem>
                        <SelectItem value="کارتن">کارتن</SelectItem>
                        <SelectItem value="شانه">شانه</SelectItem>
                        <SelectItem value="عدد">عدد</SelectItem>
                        <SelectItem value="بسته">بسته</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">فعال</label>
                    <Switch checked={productActive} onCheckedChange={setProductActive} />
                  </div>
                  <Button onClick={handleSaveProduct} className="w-full" disabled={!productName}>
                    ذخیره
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products?.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.isActive ? "فعال" : "غیرفعال"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteProductMutation.mutate(product.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
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
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
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
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>خروج از حساب کاربری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>خروج</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
