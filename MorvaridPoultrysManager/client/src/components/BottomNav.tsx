import { Link, useLocation } from "wouter";
import { LayoutDashboard, Egg, FileText, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "داشبورد" },
  { path: "/production", icon: Egg, label: "ثبت آمار" },
  { path: "/sales", icon: FileText, label: "فروش" },
  { path: "/reports", icon: BarChart3, label: "گزارشات" },
  { path: "/settings", icon: Settings, label: "تنظیمات" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 right-0 left-0 z-50 bg-card border-t border-card-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                data-testid={`nav-${item.path.replace("/", "") || "dashboard"}`}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
