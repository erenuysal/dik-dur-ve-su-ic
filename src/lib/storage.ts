import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_INTERVAL } from "../constants";
import type { AppSettings } from "../types";
import { localDayKey } from "./time";

const KEY = "dikdur.settings.v1";

const EMPTY: AppSettings = {
  enabled: false,
  intervalMinutes: DEFAULT_INTERVAL,
  pending: null,
  confirmedToday: 0,
  confirmedDate: "",
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) {
    return { ...EMPTY };
  }
  try {
    const parsed = JSON.parse(raw) as AppSettings;
    return normalizeDayCount({ ...EMPTY, ...parsed });
  } catch {
    return { ...EMPTY };
  }
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const next = normalizeDayCount(settings);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function normalizeDayCount(settings: AppSettings): AppSettings {
  const today = localDayKey(new Date());
  if (settings.confirmedDate === today) {
    return settings;
  }
  return { ...settings, confirmedDate: today, confirmedToday: 0 };
}
