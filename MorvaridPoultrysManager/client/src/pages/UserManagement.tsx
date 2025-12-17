import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User, UserRole } from "@shared/schema";
import { Users as UsersIcon, PlusCircle, Edit, Trash2 } from "lucide-react";
import { getRoleName } from "@shared/schema";

// Define user validation schema
const userSchema = z.object({
  username: z.string().min(3, "نام کاربری باید حداقل 3 کاراکتر باشد"),
  fullName: z.string().min(2, "نام کامل باید حداقل 2 کاراکتر باشد"),
  role: z.enum(["admin", "recording_officer", "sales_officer"]),
  assignedFarmId: z.string().optional(),
  password: z.string().min(1, "رمز عبور الزامی است").optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

const UserManagementPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Define roles in English with Persian labels
  const roles = [
    { id: "admin", label: "ادمین" },
    { id: "recording_officer", label: "مسئول ثبت" },
    { id: "sales_officer", label: "مسئول فروش" },
  ];

  // Load farms data
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await apiRequest("GET", "/api/farms");
        const farmsData = await response.json();
        setFarms(farmsData);
      } catch (error) {
        setFarms([]);
      }
    };
    fetchFarms();
  }, []);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      fullName: "",
      role: "recording_officer",
      assignedFarmId: undefined,
      password: undefined,
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      form.reset();
      setEditingUser(null);
    }
  }, [isDialogOpen, form]);

  // Prefill form when editing
  useEffect(() => {
    if (editingUser) {
      form.reset({
        username: editingUser.username,
        fullName: editingUser.fullName,
        role: editingUser.role,
        assignedFarmId: editingUser.assignedFarmId || undefined,
      });
    }
  }, [editingUser, form]);

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت ایجاد شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد کاربر",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/users/${id}`, data),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "اطلاعات کاربر با موفقیت به‌روزرسانی شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی کاربر",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت حذف شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف کاربر",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormValues) => {
    // Prepare data
    const userData: any = {
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      assignedFarmId: data.assignedFarmId || null,
      isActive: true,
    };

    if (editingUser) {
      // For editing, only include password if it was provided
      if (data.password) {
        userData.password = data.password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: userData });
    } else {
      // For creating, password is required
      userData.password = data.password;
      createUserMutation.mutate(userData);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (deletingUserId) {
      // Check if it's the main admin account
      const userToDelete = users.find(u => u.id === deletingUserId);
      if (deletingUserId === "rezamarefat" || (userToDelete && userToDelete.username === "rezamarefat")) {
        toast({
          title: "خطا",
          description: "حساب ادمین اصلی قابل حذف نیست.",
          variant: "destructive",
        });
      } else {
        deleteUserMutation.mutate(deletingUserId);
      }
      setDeletingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
    return days[date.getDay()];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <UsersIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">مدیریت کاربران</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>
                <PlusCircle className="h-4 w-4 ml-2" />
                افزودن کاربر
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? "اطلاعات کاربر را ویرایش کنید."
                    : "اطلاعات کاربر جدید را وارد کنید."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام کاربری</FormLabel>
                        <FormControl>
                          <Input placeholder="نام کاربری را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام کامل</FormLabel>
                        <FormControl>
                          <Input placeholder="نام کامل را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!editingUser && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="رمز عبور را وارد کنید" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {editingUser && (
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور (برای تغییر وارد کنید)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="رمز عبور جدید را وارد کنید (اختیاری)" {...field} value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نقش</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {(form.watch("role") === "recording_officer" || form.watch("role") === "sales_officer") && (
                    <FormField
                      control={form.control}
                      name="assignedFarmId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>فارم اختصاص‌یافته</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب فارم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {farms.map((farm) => (
                                <SelectItem key={farm.id} value={farm.id}>
                                  {farm.name} {!farm.isActive && "(غیرفعال)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={
                        createUserMutation.isPending ||
                        updateUserMutation.isPending
                      }
                    >
                      {createUserMutation.isPending || updateUserMutation.isPending
                        ? "در حال پردازش..."
                        : editingUser
                        ? "به‌روزرسانی"
                        : "افزودن"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>نام کاربری</TableHead>
                  <TableHead>نام کامل</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>فارم اختصاص‌یافته</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>آخرین بازدید</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  // Mock status based on last login or online status
                  const status = user.isActive !== undefined ? (user.isActive ? "فعال" : "غیرفعال") : "فعال";
                  const statusColor = user.isActive !== undefined ? (user.isActive ? "bg-green-500" : "bg-red-500") : "bg-green-500";
                  
                  // Mock last visit date - using createdAt for now since lastVisit date is not available
                  const lastVisitDate = user.createdAt || new Date().toISOString();
                  const visitDateFormatted = formatDate(lastVisitDate);
                  const dayOfWeek = getDayOfWeek(lastVisitDate);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        {getRoleName(user.role)}
                      </TableCell>
                      <TableCell>
                        {user.assignedFarmId 
                          ? farms.find(f => f.id === user.assignedFarmId)?.name || "نامشخص" 
                          : "هیچ"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full ${statusColor} mr-2`}></span>
                          {status}
                        </div>
                      </TableCell>
                      <TableCell>
                        {visitDateFormatted} <br />
                        <span className="text-xs text-muted-foreground">({dayOfWeek})</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4 ml-1" />
                            ویرایش
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingUserId(user.id)}
                            disabled={user.username === "rezamarefat"}
                            className={user.username === "rezamarefat" ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            <Trash2 className="h-4 w-4 ml-1 text-red-600" />
                            حذف
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingUserId}
        onOpenChange={(open) => !open && setDeletingUserId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تایید حذف</DialogTitle>
            <DialogDescription>
              آیا از حذف این کاربر اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingUserId(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "در حال پردازش..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;