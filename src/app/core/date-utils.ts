export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  const day = copy.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(copy, diff);
}

export function weekdayNumber(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Every ISO date between two ISO dates (inclusive). */
export function eachDate(startIso: string, endIso: string): string[] {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const result: string[] = [];
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return result;
  for (let d = start; d <= end; d = addDays(d, 1)) {
    result.push(toIsoLocal(d));
  }
  return result;
}

function toIsoLocal(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isoInRange(iso: string, startIso: string, endIso: string): boolean {
  return iso >= startIso && iso <= endIso;
}

/** number of hours (minutes / 60) */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
