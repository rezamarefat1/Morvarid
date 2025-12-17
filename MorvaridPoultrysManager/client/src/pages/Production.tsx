import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { productionFormSchema, type ProductionForm, type ProductionRecord, type FarmType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FarmSelector } from "@/components/FarmSelector";
import { JalaliDatePicker } from "@/components/JalaliDatePicker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getTodayJalali, formatNumber } from "@/lib/jalali";
import { Plus, Loader2, Egg, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Production() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: records, isLoading } = useQuery<ProductionRecord[]>({
    queryKey: ["/api/production"],
  });

  const form = useForm<ProductionForm>({
    resolver: zodResolver(productionFormSchema),
    defaultValues: {
      farmType: "morvaridi",
      date: getTodayJalali(),
      eggCount: 0,
      brokenEggs: 0,
      mortality: 0,
      feedConsumption: 0,
      waterConsumption: 0,
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
      form.reset({
        farmType: "morvaridi",
        date: getTodayJalali(),
        eggCount: 0,
        brokenEggs: 0,
        mortality: 0,
        feedConsumption: 0,
        waterConsumption: 0,
        notes: "",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "مشکلی در ثبت اطلاعات رخ داده است",
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

  const onSubmit = (data: ProductionForm) => {
    createMutation.mutate(data);
  };

  const getFarmLabel = (farmType: FarmType) => {
    return farmType === "morvaridi" ? "مرواریدی" : "متفرقه";
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <header className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">ثبت تولید</h1>
          <p className="text-muted-foreground">مدیریت آمار تولید روزانه</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-production">
              <Plus className="w-4 h-4 ml-2" />
              ثبت جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ثبت آمار تولید</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="farmType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع فارم</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eggCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تعداد تخم‌مرغ</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
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
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
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
                  disabled={createMutation.isPending}
                  data-testid="button-submit-production"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  ثبت آمار
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
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.farmType === "morvaridi" 
                          ? "bg-primary/10 text-primary" 
                          : "bg-chart-2/10 text-chart-2"
                      }`}>
                        {getFarmLabel(record.farmType)}
                      </span>
                      <span className="text-sm text-muted-foreground">{record.date}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">تخم‌مرغ: </span>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
