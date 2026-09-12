import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { INTERVAL_OPTIONS } from "../constants";
import { isConfirmAction, prepareNotifications } from "../lib/notifications";
import {
  confirmReminder,
  disableReminders,
  enableReminders,
  markDelivered,
  scheduleTestReminder,
  statusCopy,
} from "../lib/scheduler";
import { loadSettings, saveSettings } from "../lib/storage";
import { colors, space } from "../theme";
import type { AppSettings, IntervalMinutes } from "../types";

let lastHandledResponse = "";

async function applyConfirm() {
  const current = await loadSettings();
  const next = await confirmReminder(current);
  Notifications.clearLastNotificationResponse();
  return next;
}

export function HomeScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setSettings(await loadSettings());
  }, []);

  useEffect(() => {
    void refresh();
    const last = Notifications.getLastNotificationResponse();
    if (last && isConfirmAction(last.actionIdentifier)) {
      const key = `${last.notification.request.identifier}:${last.notification.date}`;
      lastHandledResponse = key;
      void applyConfirm().then(setSettings);
    }
  }, [refresh]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const kind = notification.request.content.data?.kind;
      if (kind === "reminder" || kind === "nudge" || kind === "test") {
        void loadSettings().then((current) =>
          markDelivered(current, kind, notification.request.content).then(setSettings),
        );
      }
    });
    const response = Notifications.addNotificationResponseReceivedListener((event) => {
      if (!isConfirmAction(event.actionIdentifier)) {
        return;
      }
      const key = `${event.notification.request.identifier}:${event.notification.date}`;
      if (lastHandledResponse === key) {
        return;
      }
      lastHandledResponse = key;
      void applyConfirm().then(setSettings);
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh();
      }
    });
    return () => {
      received.remove();
      response.remove();
      appState.remove();
    };
  }, [refresh]);

  const status = useMemo(() => (settings ? statusCopy(settings) : null), [settings]);
  const pendingNow = Boolean(settings?.pending?.deliveredAt);

  async function withBusy(work: () => Promise<AppSettings>) {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      setSettings(await work());
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled(enabled: boolean) {
    if (!settings) {
      return;
    }
    if (!enabled) {
      await withBusy(() => disableReminders(settings));
      return;
    }
    const allowed = await prepareNotifications();
    if (!allowed) {
      Alert.alert("Bildirim kapalı", "Ayarlardan bildirim iznini açman gerekiyor.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await withBusy(() => enableReminders(settings, settings.intervalMinutes));
  }

  async function changeInterval(minutes: IntervalMinutes) {
    if (!settings || settings.intervalMinutes === minutes) {
      return;
    }
    await Haptics.selectionAsync();
    if (settings.enabled && !settings.pending?.deliveredAt) {
      await withBusy(() => enableReminders(settings, minutes));
      return;
    }
    await withBusy(() => saveSettings({ ...settings, intervalMinutes: minutes }));
  }

  async function confirm() {
    if (!settings) {
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await withBusy(() => confirmReminder(settings));
  }

  async function sendTest() {
    if (!settings) {
      return;
    }
    const allowed = await prepareNotifications();
    if (!allowed) {
      Alert.alert("Bildirim kapalı", "Ayarlardan bildirim iznini açman gerekiyor.");
      return;
    }
    await withBusy(() => scheduleTestReminder(settings));
  }

  if (!settings || !status) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={colors.teal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.mark}>
            <View style={styles.drop} />
            <View style={styles.spine} />
          </View>
          <View>
            <Text style={styles.kicker}>Seperra</Text>
            <Text style={styles.wordmark}>Dik dur ve su iç</Text>
          </View>
        </View>

        <Text style={styles.window}>Her gün 11:00 – 21:00</Text>

        <View style={[styles.card, pendingNow && styles.cardPending]}>
          <Text style={styles.eyebrow}>{status.eyebrow}</Text>
          <Text style={styles.cardTitle}>{status.title}</Text>
          <Text style={styles.cardDetail}>{status.detail}</Text>
          {pendingNow ? (
            <Pressable style={styles.confirm} onPress={() => void confirm()}>
              <Text style={styles.confirmLabel}>Yaptım</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.section}>Aralık</Text>
        <View style={styles.chips}>
          {INTERVAL_OPTIONS.map((option) => {
            const active = settings.intervalMinutes === option.minutes;
            return (
              <Pressable
                key={option.minutes}
                onPress={() => void changeInterval(option.minutes)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleTitle}>Hatırlatmalar</Text>
            <Text style={styles.toggleHint}>Onaylanmayan bildirim durur. 3 saat sonra bir kez daha sorar.</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => void toggleEnabled(value)}
            trackColor={{ false: colors.line, true: colors.teal }}
            ios_backgroundColor={colors.line}
          />
        </View>

        <Text style={styles.today}>Bugün {settings.confirmedToday} kez onayladın</Text>

        <Pressable style={styles.ghost} onPress={() => void sendTest()}>
          <Text style={styles.ghostLabel}>5 saniye sonra dene</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
  },
  scroll: {
    padding: space.lg,
    paddingBottom: 48,
    gap: space.md,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginTop: space.sm,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  drop: {
    width: 14,
    height: 18,
    borderRadius: 10,
    backgroundColor: "#F4EFE6",
    transform: [{ rotate: "45deg" }],
    marginBottom: 4,
  },
  spine: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#F4EFE6",
  },
  kicker: {
    color: colors.water,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  wordmark: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  window: {
    color: colors.muted,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 28,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    gap: space.sm,
  },
  cardPending: {
    borderColor: colors.clay,
    backgroundColor: colors.claySoft,
  },
  eyebrow: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  cardDetail: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  confirm: {
    marginTop: space.sm,
    backgroundColor: colors.clay,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmLabel: {
    color: "#FFFBF4",
    fontSize: 17,
    fontWeight: "700",
  },
  section: {
    marginTop: space.sm,
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipLabel: {
    color: colors.ink,
    fontWeight: "600",
  },
  chipLabelActive: {
    color: "#FFFBF4",
  },
  toggleRow: {
    marginTop: space.sm,
    backgroundColor: colors.paper,
    borderRadius: 22,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  toggleHint: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 240,
  },
  today: {
    color: colors.muted,
    fontSize: 14,
  },
  ghost: {
    alignSelf: "flex-start",
    paddingVertical: 10,
  },
  ghostLabel: {
    color: colors.water,
    fontWeight: "700",
    fontSize: 15,
  },
});
