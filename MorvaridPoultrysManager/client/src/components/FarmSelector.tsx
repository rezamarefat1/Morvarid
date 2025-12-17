import { cn } from "@/lib/utils";
import type { FarmType } from "@shared/schema";

interface FarmSelectorProps {
  value: FarmType;
  onChange: (value: FarmType) => void;
  className?: string;
}

export function FarmSelector({ value, onChange, className }: FarmSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <button
        type="button"
        onClick={() => onChange("morvaridi")}
        className={cn(
          "flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm",
          value === "morvaridi"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover-elevate"
        )}
        data-testid="button-farm-morvaridi"
      >
        <span className="block text-lg mb-1">مرواریدی</span>
        <span className="text-xs opacity-70">فارم اصلی</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("motafarreqe")}
        className={cn(
          "flex-1 py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm",
          value === "motafarreqe"
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover-elevate"
        )}
        data-testid="button-farm-motafarreqe"
      >
        <span className="block text-lg mb-1">متفرقه</span>
        <span className="text-xs opacity-70">فارم‌های دیگر</span>
      </button>
    </div>
  );
}
