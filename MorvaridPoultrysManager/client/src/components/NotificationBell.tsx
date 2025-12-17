import React, { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Notification } from "@shared/schema";

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/notifications/unread");
        return await response.json();
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // TODO: Implement actual notification dropdown when clicked
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleNotifications}
        className="relative"
      >
        {unreadCount > 0 ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5 text-muted-foreground" />
        )}
        
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
      
      {/* Notification dropdown would go here if needed */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
          <div className="p-4">
            <h3 className="font-semibold">اعلان‌ها</h3>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">اعلانی وجود ندارد</p>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="py-2 border-b">
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;