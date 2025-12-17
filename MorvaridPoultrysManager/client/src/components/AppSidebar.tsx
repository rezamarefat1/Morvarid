import { Link, useLocation } from "wouter";
import { LayoutDashboard, Egg, FileText, BarChart3, Settings, LogOut, ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "داشبورد" },
  { path: "/production", icon: Egg, label: "ثبت تولید" },
  { path: "/sales", icon: FileText, label: "حواله فروش" },
  { path: "/reports", icon: BarChart3, label: "گزارش‌ها" },
  { path: "/settings", icon: Settings, label: "تنظیمات" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Egg className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-lg truncate">مرغداری مروارید</h2>
            <p className="text-xs text-muted-foreground truncate">سیستم مدیریت یکپارچه</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>منوی اصلی</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                        {isActive && (
                          <ChevronLeft className="mr-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
            {user?.fullName?.charAt(0) || "م"}
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">{user?.fullName || "کاربر"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="group-data-[collapsible=icon]:hidden"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
