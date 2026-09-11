export type PacingBrand = "medsystems" | "beautysystems";

export const LEAD_TARGETS = {
  "2026-09": {
    label: "Set/26",
    medsystems: { total: 680, paid: 360 },
    beautysystems: { total: 1450, paid: 1180 },
  },
  "2026-10": {
    label: "Out/26",
    medsystems: { total: 550, paid: 380 },
    beautysystems: { total: 1450, paid: 1180 },
  },
} as const;

type Metric = "total" | "paid";
type TargetMonth = keyof typeof LEAD_TARGETS;

function daysInMonth(month: string) {
  const [year, numericMonth] = month.split("-").map(Number);
  return new Date(Date.UTC(year, numericMonth, 0)).getUTCDate();
}

function aggregateTargets(month: TargetMonth, metric: Metric) {
  const target = LEAD_TARGETS[month];
  return target.medsystems[metric] + target.beautysystems[metric];
}

export function buildLeadPacing(input: {
  period: { start: string; end: string };
  actual: Record<PacingBrand, { total: number; paid: number }>;
}) {
  const month = input.period.end.slice(0, 7) as TargetMonth;
  const configuredTarget = LEAD_TARGETS[month];
  const target = configuredTarget ?? {
    label: month,
    medsystems: { total: 0, paid: 0 },
    beautysystems: { total: 0, paid: 0 },
  };
  const calendarDays = daysInMonth(month);
  const elapsedDays = Math.min(calendarDays, Math.max(1, Number(input.period.end.slice(8, 10))));
  const remainingDays = Math.max(0, calendarDays - elapsedDays);
  const isMonthToDate = input.period.start === `${month}-01` && input.period.end.startsWith(month);
  const metric = (key: Metric) => (["medsystems", "beautysystems"] as PacingBrand[]).map(brand => {
    const targetValue = target[brand][key];
    const actualValue = input.actual[brand][key];
    const expectedByDate = (targetValue / calendarDays) * elapsedDays;
    return {
      brand,
      target: targetValue,
      actual: actualValue,
      attainmentPct: targetValue ? (actualValue / targetValue) * 100 : 0,
      expectedByDate,
      paceDelta: actualValue - expectedByDate,
      projected: elapsedDays ? (actualValue / elapsedDays) * calendarDays : 0,
      dailyRequired: remainingDays ? Math.max(0, targetValue - actualValue) / remainingDays : 0,
    };
  });
  const consolidate = (rows: ReturnType<typeof metric>) => ({
    brand: "consolidado" as const,
    target: rows.reduce((sum, row) => sum + row.target, 0),
    actual: rows.reduce((sum, row) => sum + row.actual, 0),
    attainmentPct: 0,
    expectedByDate: rows.reduce((sum, row) => sum + row.expectedByDate, 0),
    paceDelta: rows.reduce((sum, row) => sum + row.paceDelta, 0),
    projected: rows.reduce((sum, row) => sum + row.projected, 0),
    dailyRequired: rows.reduce((sum, row) => sum + row.dailyRequired, 0),
  });
  const total = metric("total");
  const paid = metric("paid");
  const totals = { total: consolidate(total), paid: consolidate(paid) };
  totals.total.attainmentPct = totals.total.target ? (totals.total.actual / totals.total.target) * 100 : 0;
  totals.paid.attainmentPct = totals.paid.target ? (totals.paid.actual / totals.paid.target) * 100 : 0;

  return {
    available: Boolean(configuredTarget),
    month,
    label: target.label,
    calendarDays,
    elapsedDays,
    remainingDays,
    isMonthToDate,
    total: [...total, totals.total],
    paid: [...paid, totals.paid],
    targetTimeline: (Object.keys(LEAD_TARGETS) as TargetMonth[]).map(key => ({
      month: key,
      label: LEAD_TARGETS[key].label,
      total: aggregateTargets(key, "total"),
      paid: aggregateTargets(key, "paid"),
      medsystems: LEAD_TARGETS[key].medsystems,
      beautysystems: LEAD_TARGETS[key].beautysystems,
    })),
    methodology: {
      total: "Leads técnicos do funil RD Station → Bitrix24 nos pipelines MedSystems e BeautySystems; registros sem BU reconhecida não entram na meta consolidada.",
      paid: "Subconjunto dos mesmos leads cujo contato RD Station possui ao menos uma conversão qualificada classificada como mídia paga no período.",
    },
  };
}
