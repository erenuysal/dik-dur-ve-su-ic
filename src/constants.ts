import type { IntervalMinutes } from "./types";

export const WINDOW_START_HOUR = 11;
export const WINDOW_END_HOUR = 21;
export const NUDGE_AFTER_MS = 3 * 60 * 60 * 1000;

export const CHANNEL_ID = "hatirlatmalar";
export const CATEGORY_ID = "hatirlatma";
export const ACTION_CONFIRM = "yaptim";
export const ACTION_WATER = "ictim";
export const ACTION_POSTURE = "dikdurdum";

export const REMINDER_ID = "dikdur_reminder";
export const NUDGE_ID = "dikdur_nudge";
export const TEST_ID = "dikdur_test";

export const INTERVAL_OPTIONS: { minutes: IntervalMinutes; label: string }[] = [
  { minutes: 30, label: "30 dk" },
  { minutes: 60, label: "1 sa" },
  { minutes: 90, label: "1,5 sa" },
  { minutes: 120, label: "2 sa" },
  { minutes: 180, label: "3 sa" },
];

export const DEFAULT_INTERVAL: IntervalMinutes = 60;
