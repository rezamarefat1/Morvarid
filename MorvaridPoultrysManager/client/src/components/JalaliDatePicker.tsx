import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toJalali, toGregorian, getJalaliMonthName, formatNumber } from "@/lib/jalali";
import jalaali from "jalaali-js";

interface JalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  className,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const parts = value.split("/").map(Number);
      return { jy: parts[0], jm: parts[1] };
    }
    const today = toJalali(new Date());
    return { jy: today.jy, jm: today.jm };
  });

  const today = toJalali(new Date());
  const selectedParts = value ? value.split("/").map(Number) : null;

  const daysInMonth = jalaali.jalaaliMonthLength(viewDate.jy, viewDate.jm);
  const firstDayOfMonth = toGregorian(viewDate.jy, viewDate.jm, 1).getDay();
  const startOffset = (firstDayOfMonth + 1) % 7;

  const prevMonth = () => {
    if (viewDate.jm === 1) {
      setViewDate({ jy: viewDate.jy - 1, jm: 12 });
    } else {
      setViewDate({ ...viewDate, jm: viewDate.jm - 1 });
    }
  };

  const nextMonth = () => {
    if (viewDate.jm === 12) {
      setViewDate({ jy: viewDate.jy + 1, jm: 1 });
    } else {
      setViewDate({ ...viewDate, jm: viewDate.jm + 1 });
    }
  };

  const selectDay = (day: number) => {
    const dateStr = `${viewDate.jy}/${viewDate.jm.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}`;
    onChange(dateStr);
    setOpen(false);
  };

  const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-right font-normal w-full",
            !value && "text-muted-foreground",
            className
          )}
          data-testid="button-date-picker"
        >
          <Calendar className="ml-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="font-semibold">
              {getJalaliMonthName(viewDate.jm)} {formatNumber(viewDate.jy)}
            </span>
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedParts &&
                selectedParts[0] === viewDate.jy &&
                selectedParts[1] === viewDate.jm &&
                selectedParts[2] === day;
              const isToday =
                today.jy === viewDate.jy &&
                today.jm === viewDate.jm &&
                today.jd === day;

              return (
                <Button
                  key={day}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    isToday && !isSelected && "border border-primary text-primary"
                  )}
                  onClick={() => selectDay(day)}
                >
                  {formatNumber(day)}
                </Button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                const todayStr = `${today.jy}/${today.jm.toString().padStart(2, "0")}/${today.jd.toString().padStart(2, "0")}`;
                onChange(todayStr);
                setOpen(false);
              }}
            >
              امروز
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
