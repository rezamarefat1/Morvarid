import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, type LoginForm } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Egg, Fingerprint, Loader2, User, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/utilities/ThemeToggle";

export default function Login() {
  const { login, loginWithBiometric, isBiometricAvailable } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const success = await login(data.username, data.password);
      if (!success) {
        toast({
          title: "خطا در ورود",
          description: "نام کاربری یا رمز عبور اشتباه است",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطا",
        description: "مشکلی در برقراری ارتباط رخ داده است",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    try {
      const success = await loginWithBiometric();
      if (!success) {
        toast({
          title: "خطا",
          description: "احراز هویت بیومتریک انجام نشد",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطا",
        description: "دستگاه شما از احراز هویت بیومتریک پشتیبانی نمی‌کند",
        variant: "destructive",
      });
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
            <Egg className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">صنایع غذایی و کشاورزی مروارید</CardTitle>
          <CardDescription>وارد حساب کاربری خود شوید</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* فرم ورود - اول */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کاربری</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="نام کاربری را وارد کنید"
                          className="pr-10"
                          data-testid="input-username"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          placeholder="رمز عبور را وارد کنید"
                          className="pr-10"
                          data-testid="input-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : null}
                ورود به سیستم
              </Button>
            </form>
          </Form>

          {/* دکمه اثر انگشت - پایین */}
          {isBiometricAvailable && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">یا</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-14 text-lg gap-3"
                onClick={handleBiometricLogin}
                disabled={isBiometricLoading}
                data-testid="button-biometric-login"
              >
                {isBiometricLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Fingerprint className="w-6 h-6" />
                )}
                ورود با اثر انگشت
              </Button>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            نسخه ۱.۱.۰ - صنایع غذایی و کشاورزی مروارید - توسعه‌دهنده: رضا معرفت
          </p>
        </CardContent>
      </Card>
    </div>
  );
}