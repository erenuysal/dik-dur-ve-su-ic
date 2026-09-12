import { NUDGE_AFTER_MS, WINDOW_END_HOUR, WINDOW_START_HOUR } from "../constants";

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function atLocalHour(date: Date, hour: number, minute = 0): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export function isInsideWindow(date: Date): boolean {
  const start = atLocalHour(date, WINDOW_START_HOUR);
  const end = atLocalHour(date, WINDOW_END_HOUR);
  return date >= start && date < end;
}

export function nextWindowStart(from: Date): Date {
  const todayStart = atLocalHour(from, WINDOW_START_HOUR);
  if (from < todayStart) {
    return todayStart;
  }
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return atLocalHour(tomorrow, WINDOW_START_HOUR);
}

export function clampToWindow(candidate: Date): Date {
  const start = atLocalHour(candidate, WINDOW_START_HOUR);
  const end = atLocalHour(candidate, WINDOW_END_HOUR);
  if (candidate < start) {
    return start;
  }
  if (candidate >= end) {
    return nextWindowStart(end);
  }
  return candidate;
}

export function nextReminderAt(from: Date, intervalMinutes: number): Date {
  if (!isInsideWindow(from)) {
    return nextWindowStart(from);
  }
  return clampToWindow(new Date(from.getTime() + intervalMinutes * 60 * 1000));
}

export function nudgeAt(deliveredAt: Date): Date {
  return clampToWindow(new Date(deliveredAt.getTime() + NUDGE_AFTER_MS));
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDayClock(date: Date, now = new Date()): string {
  const clock = formatClock(date);
  if (localDayKey(date) === localDayKey(now)) {
    return clock;
  }
  return `${date.toLocaleDateString("tr-TR", { weekday: "short" })} ${clock}`;
}
