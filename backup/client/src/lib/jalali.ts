import jalaali from "jalaali-js";

export function toJalali(date: Date): { jy: number; jm: number; jd: number } {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function toGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function formatJalaliDate(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
}

export function parseJalaliDate(dateStr: string): Date {
  const parts = dateStr.split("/").map(Number);
  if (parts.length !== 3) return new Date();
  return toGregorian(parts[0], parts[1], parts[2]);
}

export function getTodayJalali(): string {
  return formatJalaliDate(new Date());
}

export function getJalaliMonthName(month: number): string {
  const months = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند"
  ];
  return months[month - 1] || "";
}

export function getJalaliWeekdayName(date: Date): string {
  const weekdays = [
    "یکشنبه", "دوشنبه", "سه‌شنبه",
    "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"
  ];
  return weekdays[date.getDay()];
}

export function formatJalaliDateLong(date: Date): string {
  const { jy, jm, jd } = toJalali(date);
  const weekday = getJalaliWeekdayName(date);
  const month = getJalaliMonthName(jm);
  return `${weekday}، ${jd} ${month} ${jy}`;
}

export function getStartOfJalaliWeek(date: Date): Date {
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - diff);
  return startOfWeek;
}

export function getStartOfJalaliMonth(date: Date): Date {
  const { jy, jm } = toJalali(date);
  return toGregorian(jy, jm, 1);
}

export function toPersianDigits(num: number | string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("fa-IR").format(num);
}

export function formatCurrency(num: number): string {
  return `${formatNumber(num)} تومان`;
}
