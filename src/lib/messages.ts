import type { ReminderKind } from "../types";

export type ReminderCopy = {
  title: string;
  body: string;
};

const REMINDERS: ReminderCopy[] = [
  { title: "Dik dur", body: "Omuzlarını geri al, bir yudum su iç." },
  { title: "Su iç", body: "Kalk, gerin, bir bardak su." },
  { title: "Dik dur", body: "Ekrandan başını kaldır. Su zamanı." },
  { title: "Su iç", body: "Dik otur. Küçük bir yudum yeter." },
  { title: "Dik dur", body: "Sırtını düzelt, suyu unutma." },
];

const NUDGES: ReminderCopy[] = [
  { title: "Hâlâ buradayım", body: "Sağlıklı olman için uğraşıyorum, şu suyu içer misin?" },
  { title: "Seni bekliyorum", body: "3 saattir haber yok. Dik dur, bir yudum al." },
  { title: "Nazikçe tekrar", body: "Bildirim duruyor. Şu suyu içer, omuzlarını geri alır mısın?" },
];

const TEST: ReminderCopy = {
  title: "Dik dur",
  body: "Deneme: omuzlar geri, bir yudum su.",
};

export function pickCopy(kind: ReminderKind, seed = Date.now()): ReminderCopy {
  if (kind === "test") {
    return TEST;
  }
  const pool = kind === "nudge" ? NUDGES : REMINDERS;
  return pool[seed % pool.length];
}
