import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { productionFormSchema, type ProductionForm, type ProductionRecord, type Farm } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FarmSelector } from "@/components/FarmSelector";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getTodayJalali, formatNumber } from "@/lib/jalali";
import { Plus, Loader2, Egg, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Production() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const { toast } = useToast();

  const { data: records, isLoading } = useQuery<ProductionRecord[]>({
    queryKey: ["/api/production"],
  });

  const { data: farms } = useQuery<Farm[]>({
    queryKey: ["/api/farms/active"],
  });

  const form = useForm<ProductionForm>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      farmId: "",
      date: getTodayJalali(),
      eggCount: 0,
      brokenEggs: 0,
      mortality: 0,
      feedConsumption: 0,
      waterConsumption: 0,
      yesterdayInventory: 0,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductionForm) => {
      return apiRequest("POST", "/api/production", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "ثبت شد",
        description: "آمار تولید با موفقیت ثبت شد",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "مشکلی در ثبت اطلاعات رخ داده است",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductionForm> }) => {
      return apiRequest("PUT", `/api/production/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "ویرایش شد",
        description: "رکورد با موفقیت ویرایش شد",
      });
      setEditingRecord(null);
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "مشکلی در ویرایش رخ داده است",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/production/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/production"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/dashboard"] });
      toast({
        title: "حذف شد",
        description: "رکورد با موفقیت حذف شد",
      });
    },
  });

  const resetForm = () => {
    form.reset({
      farmId: "",
      date: getTodayJalali(),
      eggCount: 0,
      brokenEggs: 0,
      mortality: 0,
      feedConsumption: 0,
      waterConsumption: 0,
      yesterdayInventory: 0,
      notes: "",
    });
  };

  const onSubmit = (data: ProductionForm) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    form.reset({
      farmId: record.farmId,
      date: record.date,
      eggCount: record.eggCount,
      brokenEggs: record.brokenEggs,
      mortality: record.mortality,
      feedConsumption: record.feedConsumption,
      waterConsumption: record.waterConsumption,
      yesterdayInventory: record.yesterdayInventory || 0,
      notes: record.notes || "",
    });
    setIsDialogOpen(true);
  };

  const getFarmName = (farmId: string) => {
    return farms?.find(f => f.id === farmId)?.name || "نامشخص";
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ثبت آمار</h1>
          <p className="text-muted-foreground">مدیریت آمار تولید روزانه</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingRecord(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-production">
              <Plus className="w-4 h-4 ml-2" />
              ثبت جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "ویرایش آمار" : "ثبت آمار تولید"}</DialogTitle>
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
                  name="yesterdayInventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>موجودی دیروز</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          className="text-left"
                          dir="ltr"
                          data-testid="input-yesterday-inventory"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eggCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تولید روزانه</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            className="text-left"
                            dir="ltr"
                            data-testid="input-egg-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brokenEggs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تخم‌مرغ شکسته</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            className="text-left"
                            dir="ltr"
                            data-testid="input-broken-eggs"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mortality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تلفات (قطعه)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                          className="text-left"
                          dir="ltr"
                          data-testid="input-mortality"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feedConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مصرف دان (کیلوگرم)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            className="text-left"
                            dir="ltr"
                            data-testid="input-feed"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="waterConsumption"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مصرف آب (لیتر)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                            className="text-left"
                            dir="ltr"
                            data-testid="input-water"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          rows={3}
                          data-testid="input-notes"
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
                  data-testid="button-submit-production"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  {editingRecord ? "ذخیره تغییرات" : "ثبت آمار"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !records?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Egg className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">هنوز رکوردی ثبت نشده</h3>
            <p className="text-muted-foreground mb-4">اولین آمار تولید را ثبت کنید</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              ثبت اولین رکورد
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
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
                        <span className="font-semibold tabular-nums">{formatNumber(record.eggCount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">شکسته: </span>
                        <span className="font-semibold tabular-nums">{formatNumber(record.brokenEggs)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">تلفات: </span>
                        <span className="font-semibold tabular-nums">{formatNumber(record.mortality)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">دان: </span>
                        <span className="font-semibold tabular-nums">{formatNumber(record.feedConsumption)} کیلو</span>
                      </div>
                    </div>
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{record.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(record)}
                      data-testid={`button-edit-${record.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(record.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${record.id}`}
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
