export default function UserManagement() {
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            مدیریت کاربران
          </h1>
          <p className="text-muted-foreground">
            این بخش در حال توسعه است. به زودی امکان مدیریت کامل کاربران از این قسمت فراهم خواهد شد.
          </p>
        </header>

        <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-8 text-center space-y-3">
          <p className="text-muted-foreground">
            فعلاً برای تست رابط کاربری، این صفحه فقط یک متن ساده نمایش می‌دهد.
          </p>
          <p className="text-sm text-muted-foreground">
            اگر در بخش‌های دیگر برنامه اروری نداریم و فقط این صفحه مشکل داشت،
            الان باید کل برنامه بدون صفحه سفید بالا بیاید.
          </p>
        </div>
      </div>
    </div>
  );
}