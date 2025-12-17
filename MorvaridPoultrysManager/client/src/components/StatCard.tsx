import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/jalali";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: LucideIcon;
  trend?: number;
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  className,
  iconColor = "text-primary",
}: StatCardProps) {
  const TrendIcon = trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor = trend && trend > 0 ? "text-green-500" : trend && trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl md:text-3xl font-bold tabular-nums">
              {formatNumber(value)}
              {unit && <span className="text-sm font-normal text-muted-foreground mr-1">{unit}</span>}
            </p>
            {trend !== undefined && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span>{Math.abs(trend)}% نسبت به هفته گذشته</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10", iconColor)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
