export const RD_ACCOUNTS = ["medsystems", "beautysystems"] as const;
export type RdAccountKey = (typeof RD_ACCOUNTS)[number];

export const RD_ACCOUNT_META: Record<RdAccountKey, { label: string; shortLabel: string }> = {
  medsystems: { label: "Medsystems", shortLabel: "Med" },
  beautysystems: { label: "BeautySystems", shortLabel: "Beauty" },
};

export function isRdAccountKey(value: string): value is RdAccountKey {
  return (RD_ACCOUNTS as readonly string[]).includes(value);
}

export const JULY_2026 = {
  start: new Date("2026-07-01T00:00:00.000Z"),
  end: new Date("2026-08-01T00:00:00.000Z"),
  label: "01 jul 2026 — 31 jul 2026",
};

export function isInJuly2026(dateValue: string | Date | null | undefined) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return !Number.isNaN(date.valueOf()) && date >= JULY_2026.start && date < JULY_2026.end;
}
