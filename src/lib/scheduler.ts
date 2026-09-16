import { NUDGE_ID, REMINDER_ID, TEST_ID } from "../constants";
import type { AppSettings, IntervalMinutes, PendingReminder, ReminderKind } from "../types";
import { pickCopy } from "./messages";
import {
  cancelAllReminders,
  dismissPresented,
  getNotificationGranted,
  scheduleLocalReminder,
} from "./notifications";
import { saveSettings } from "./storage";
import { formatDayClock, nextReminderAt, nudgeAt } from "./time";

export async function disableReminders(settings: AppSettings): Promise<AppSettings> {
  await cancelAllReminders();
  await dismissPresented();
  return saveSettings({ ...settings, enabled: false, pending: null });
}

export async function enableReminders(
  settings: AppSettings,
  intervalMinutes: IntervalMinutes,
  now = new Date(),
): Promise<AppSettings> {
  await cancelAllReminders();
  const when = nextReminderAt(now, intervalMinutes);
  const pending = await planPair("reminder", when);
  return saveSettings({
    ...settings,
    enabled: true,
    intervalMinutes,
    pending,
  });
}

export async function confirmReminder(settings: AppSettings, now = new Date()): Promise<AppSettings> {
  await cancelAllReminders();
  await dismissPresented();
  const counted = {
    ...settings,
    pending: null,
    confirmedToday: settings.confirmedToday + 1,
  };
  if (!settings.enabled) {
    return saveSettings(counted);
  }
  const when = nextReminderAt(now, settings.intervalMinutes);
  const pending = await planPair("reminder", when);
  return saveSettings({ ...counted, pending });
}

export async function markDelivered(
  settings: AppSettings,
  kind: ReminderKind,
  copy?: { title?: string | null; body?: string | null },
  now = new Date(),
): Promise<AppSettings> {
  if (!settings.pending) {
    return settings;
  }
  if (settings.pending.deliveredAt && settings.pending.kind === kind) {
    return settings;
  }
  return saveSettings({
    ...settings,
    pending: {
      ...settings.pending,
      kind,
      title: copy?.title ?? settings.pending.title,
      body: copy?.body ?? settings.pending.body,
      deliveredAt: settings.pending.deliveredAt ?? now.toISOString(),
    },
  });
}

export async function scheduleTestReminder(settings: AppSettings): Promise<AppSettings> {
  const when = new Date(Date.now() + 5000);
  const copy = pickCopy("test", when.getTime());
  if (await getNotificationGranted()) {
    await scheduleLocalReminder({
      id: TEST_ID,
      when,
      kind: "test",
    });
  }
  return saveSettings({
    ...settings,
    pending: {
      kind: "test",
      title: copy.title,
      body: copy.body,
      scheduledAt: when.toISOString(),
      reminderId: TEST_ID,
      nudgeId: NUDGE_ID,
    },
  });
}

export async function syncInAppDelivery(
  settings: AppSettings,
  now = new Date(),
): Promise<AppSettings> {
  if (!settings.enabled || !settings.pending || settings.pending.deliveredAt) {
    return settings;
  }
  if (new Date(settings.pending.scheduledAt) > now) {
    return settings;
  }
  return markDelivered(settings, settings.pending.kind, undefined, now);
}

export function statusCopy(settings: AppSettings, now = new Date()): {
  eyebrow: string;
  title: string;
  detail: string;
} {
  if (!settings.enabled) {
    return {
      eyebrow: "Kapalı",
      title: "Hatırlatma yok",
      detail:
        "Hatırlatmalar isteğe bağlı. Açınca 11:00–21:00 arasında, seçtiğin aralıkla uygulama içinde gelir. Bildirim izni vermen gerekmez.",
    };
  }
  if (settings.pending?.deliveredAt) {
    return {
      eyebrow: settings.pending.kind === "nudge" ? "Hâlâ bekliyorum" : "Sıra sende",
      title: settings.pending.title,
      detail: settings.pending.body,
    };
  }
  if (settings.pending) {
    return {
      eyebrow: "Sıradaki",
      title: formatDayClock(new Date(settings.pending.scheduledAt), now),
      detail:
        "Onaylamadan yenisi gelmez. Bildirim izni yoksa hatırlatma uygulama açıkken burada durur. 3 saat tıklanmazsa bir kez daha sorar.",
    };
  }
  return {
    eyebrow: "Hazır",
    title: "İlk hatırlatmayı kur",
    detail: "Aşağıdan aralığı seç, hatırlatmaları aç.",
  };
}

async function planPair(kind: ReminderKind, when: Date): Promise<PendingReminder> {
  const copy = pickCopy(kind, when.getTime());
  if (await getNotificationGranted()) {
    await scheduleLocalReminder({
      id: REMINDER_ID,
      when,
      kind,
    });
    await scheduleLocalReminder({
      id: NUDGE_ID,
      when: nudgeAt(when),
      kind: "nudge",
    });
  }
  return {
    kind,
    title: copy.title,
    body: copy.body,
    scheduledAt: when.toISOString(),
    reminderId: REMINDER_ID,
    nudgeId: NUDGE_ID,
  };
}
