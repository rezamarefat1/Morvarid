import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { Farm } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface FarmSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  onlyActive?: boolean;
}

export function FarmSelector({ value, onChange, className, onlyActive = true }: FarmSelectorProps) {
  const { data: farms, isLoading } = useQuery<Farm[]>({
    queryKey: [onlyActive ? "/api/farms/active" : "/api/farms"],
  });

  if (isLoading) {
    return (
      <div className={cn("flex gap-2", className)}>
        <Skeleton className="flex-1 h-16" />
        <Skeleton className="flex-1 h-16" />
      </div>
    );
  }

  if (!farms?.length) {
    return (
      <div className="text-center p-4 text-muted-foreground border rounded-lg">
        هیچ فارم فعالی وجود ندارد
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {farms.map((farm) => (
        <button
          key={farm.id}
          type="button"
          onClick={() => onChange(farm.id)}
          className={cn(
            "flex-1 min-w-[120px] py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm",
            value === farm.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:border-primary/50"
          )}
          data-testid={`button-farm-${farm.id}`}
        >
          <span className="block text-lg mb-1">{farm.name}</span>
          <span className="text-xs opacity-70">
            {farm.isActive ? "فعال" : "غیرفعال"}
          </span>
        </button>
      ))}
    </div>
  );
}
