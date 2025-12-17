import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { invoiceFormSchema, type InvoiceForm, type SalesInvoice, type Farm, type Product } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FarmSelector } from "@/components/FarmSelector";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getTodayJalali, formatNumber, formatCurrency } from "@/lib/jalali";
import { Plus, Loader2, FileText, Trash2, Printer, Download, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportInvoicesToExcel } from "@/lib/excel";

export default function Sales() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<SalesInvoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: farms } = useQuery<Farm[]>({
    queryKey: ["/api/farms/active"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      farmId: "",
      productId: "",
      date: getTodayJalali(),
      customerName: "",
      customerPhone: "",
      quantity: 0,
      weight: 0,
      pricePerUnit: 0,
      isPaid: false,
      notes: "",
    },
  });

  const quantity = form.watch("quantity");
  const pricePerUnit = form.watch("pricePerUnit");
  const totalPrice = quantity * pricePerUnit;

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "ثبت شد",
        description: "حواله فروش با موفقیت ثبت شد",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "مشکلی در ثبت حواله رخ داده است",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InvoiceForm> }) => {
      return apiRequest("PUT", `/api/invoices/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "ویرایش شد",
        description: "حواله با موفقیت ویرایش شد",
      });
      setEditingInvoice(null);
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "حذف شد",
        description: "حواله با موفقیت حذف شد",
      });
    },
  });

  const resetForm = () => {
    form.reset({
      farmId: "",
      productId: "",
      date: getTodayJalali(),
      customerName: "",
      customerPhone: "",
      quantity: 0,
      weight: 0,
      pricePerUnit: 0,
      isPaid: false,
      notes: "",
    });
  };

  const onSubmit = (data: InvoiceForm) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (invoice: SalesInvoice) => {
    setEditingInvoice(invoice);
    form.reset({
      farmId: invoice.farmId,
      productId: invoice.productId || "",
      date: invoice.date,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || "",
      quantity: invoice.quantity,
      weight: invoice.weight || 0,
      pricePerUnit: invoice.pricePerUnit,
      isPaid: invoice.isPaid || false,
      notes: invoice.notes || "",
    });
    setIsDialogOpen(true);
  };

  const getFarmName = (farmId: string) => {
    return farms?.find(f => f.id === farmId)?.name || "نامشخص";
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "";
    return products?.find(p => p.id === productId)?.name || "";
  };

  const handleExportExcel = () => {
    if (invoices?.length) {
      const excelData = invoices.map(inv => ({
        ...inv,
        farmType: getFarmName(inv.farmId) as any,
        eggQuantity: inv.quantity,
      }));
      exportInvoicesToExcel(excelData, `فروش-${getTodayJalali()}`);
      toast({
        title: "دانلود شد",
        description: "فایل اکسل با موفقیت دانلود شد",
      });
    }
  };

  const recentInvoices = invoices?.slice(0, 7) || [];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">حواله فروش</h1>
          <p className="text-muted-foreground">مدیریت فاکتورهای فروش</p>
        </div>
        <div className="flex gap-2">
          {invoices?.length ? (
            <Button variant="outline" onClick={handleExportExcel} data-testid="button-export-excel">
              <Download className="w-4 h-4 ml-2" />
              خروجی اکسل
            </Button>
          ) : null}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingInvoice(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-invoice">
                <Plus className="w-4 h-4 ml-2" />
                حواله جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingInvoice ? "ویرایش حواله" : "ثبت حواله فروش"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="farmId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>انتخاب فارم</FormLabel>
                        <FormControl>
                          <FarmSelector
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>محصول</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب محصول" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ</FormLabel>
                        <FormControl>
                          <JalaliDatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام مشتری</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="نام مشتری را وارد کنید"
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره تماس (اختیاری)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="09xxxxxxxxx"
                            className="text-left"
                            dir="ltr"
                            data-testid="input-customer-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تعداد</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                              className="text-left"
                              dir="ltr"
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وزن (کیلوگرم)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                              className="text-left"
                              dir="ltr"
                              data-testid="input-weight"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pricePerUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت واحد (تومان)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            className="text-left"
                            dir="ltr"
                            data-testid="input-price-per-unit"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">جمع کل:</span>
                      <span className="text-xl font-bold text-primary tabular-nums">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-base">پرداخت شده</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-paid"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>یادداشت</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="توضیحات اضافی..."
                            rows={2}
                            data-testid="input-invoice-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-invoice"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    {editingInvoice ? "ذخیره تغییرات" : "ثبت حواله"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : !invoices?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">هنوز حواله‌ای ثبت نشده</h3>
            <p className="text-muted-foreground mb-4">اولین حواله فروش را ثبت کنید</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              ثبت اولین حواله
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recentInvoices.map((invoice) => (
            <Card key={invoice.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold">{invoice.invoiceNumber}</span>
                      <Badge variant={invoice.isPaid ? "default" : "secondary"} className="text-xs">
                        {invoice.isPaid ? "پرداخت شده" : "پرداخت نشده"}
                      </Badge>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {getFarmName(invoice.farmId)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <p className="font-medium">{invoice.customerName}</p>
                      {invoice.customerPhone && (
                        <p className="text-sm text-muted-foreground" dir="ltr">{invoice.customerPhone}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
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
                        <span className="font-semibold tabular-nums">{formatNumber(invoice.quantity)}</span>
                      </div>
                      {invoice.weight && (
                        <div>
                          <span className="text-muted-foreground">وزن: </span>
                          <span className="tabular-nums">{formatNumber(invoice.weight)} کیلو</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">جمع: </span>
                        <span className="font-bold text-primary tabular-nums">{formatCurrency(invoice.totalPrice)}</span>
                      </div>
                    </div>
                    {getProductName(invoice.productId) && (
                      <p className="text-sm text-muted-foreground mt-1">محصول: {getProductName(invoice.productId)}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(invoice)}
                      data-testid={`button-edit-${invoice.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.print()}
                      data-testid={`button-print-${invoice.id}`}
                    >
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(invoice.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${invoice.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
