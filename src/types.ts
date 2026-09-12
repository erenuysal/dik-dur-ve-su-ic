export type ReminderKind = "reminder" | "nudge" | "test";

export type IntervalMinutes = 30 | 60 | 90 | 120 | 180;

export type PendingReminder = {
  kind: ReminderKind;
  title: string;
  body: string;
  scheduledAt: string;
  deliveredAt?: string;
  reminderId: string;
  nudgeId: string;
};

export type AppSettings = {
  enabled: boolean;
  intervalMinutes: IntervalMinutes;
  pending: PendingReminder | null;
  confirmedToday: number;
  confirmedDate: string;
};
