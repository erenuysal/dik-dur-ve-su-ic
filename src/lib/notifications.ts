import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  ACTION_CONFIRM,
  ACTION_POSTURE,
  ACTION_WATER,
  CATEGORY_ID,
  CHANNEL_ID,
} from "../constants";
import type { ReminderKind } from "../types";
import { pickCopy } from "./messages";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationChrome(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Dik dur ve su iç",
      description: "İsteğe bağlı duruş ve su hatırlatmaları (11:00–21:00)",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#1F6B5A",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      showBadge: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(
    CATEGORY_ID,
    [
      {
        identifier: ACTION_WATER,
        buttonTitle: "İçtim",
        options: { opensAppToForeground: true },
      },
      {
        identifier: ACTION_POSTURE,
        buttonTitle: "Dik durdum",
        options: { opensAppToForeground: true },
      },
    ],
    {
      previewPlaceholder: "Dik dur ve su iç",
      showTitle: true,
      showSubtitle: true,
    },
  );
}

export async function getNotificationGranted(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  return existing.status === "granted";
}

/** Only call after the user explicitly chooses system notifications. */
export async function requestNotificationPermission(): Promise<boolean> {
  await setupNotificationChrome();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") {
    return true;
  }
  if (existing.status === "denied" && !existing.canAskAgain) {
    return false;
  }
  const asked = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return asked.status === "granted";
}

/** @deprecated Use getNotificationGranted / requestNotificationPermission. */
export async function prepareNotifications(): Promise<boolean> {
  return getNotificationGranted();
}

export function isConfirmAction(actionIdentifier: string): boolean {
  return (
    actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ||
    actionIdentifier === ACTION_CONFIRM ||
    actionIdentifier === ACTION_WATER ||
    actionIdentifier === ACTION_POSTURE
  );
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function dismissPresented(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

export async function scheduleLocalReminder(input: {
  id: string;
  when: Date;
  kind: ReminderKind;
}): Promise<{ id: string; title: string; body: string }> {
  const copy = pickCopy(input.kind, input.when.getTime());
  await Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: {
      title: copy.title,
      subtitle: "Dik dur ve su iç",
      body: copy.body,
      categoryIdentifier: CATEGORY_ID,
      sound: "default",
      color: "#1F6B5A",
      interruptionLevel: input.kind === "nudge" ? "timeSensitive" : "active",
      sticky: true,
      autoDismiss: false,
      data: { kind: input.kind },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.when,
      channelId: CHANNEL_ID,
    },
  });
  return { id: input.id, ...copy };
}
