const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export type AnalyticsPeriod = `${number}-${number}`;

export function saoPauloDateKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentAnalyticsPeriod(now = new Date()): AnalyticsPeriod {
  return saoPauloDateKey(now).slice(0, 7) as AnalyticsPeriod;
}

export function isAnalyticsPeriod(value: string): value is AnalyticsPeriod {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function reportingPeriodRange(period: AnalyticsPeriod, now = new Date()) {
  if (!isAnalyticsPeriod(period)) throw new Error("Período mensal inválido.");
  const currentPeriod = currentAnalyticsPeriod(now);
  if (period > currentPeriod) throw new Error("O período selecionado ainda não está disponível.");

  const [year, month] = period.split("-").map(Number);
  const start = new Date(`${period}-01T00:00:00-03:00`);
  const nextMonth = month === 12
    ? new Date(`${year + 1}-01-01T00:00:00-03:00`)
    : new Date(`${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00-03:00`);
  const end = period === currentPeriod
    ? new Date(`${saoPauloDateKey(now)}T00:00:00-03:00`)
    : nextMonth;
  const endLabel = end > start
    ? saoPauloDateKey(new Date(end.getTime() - 1))
    : null;

  return {
    key: period,
    start,
    end,
    startLabel: `${period}-01`,
    endLabel,
    endExclusiveLabel: saoPauloDateKey(end),
    hasAvailableDays: end > start,
  };
}

/**
 * Intervalo padrão dos painéis operacionais: mês corrente até o último dia
 * fechado em São Paulo. O cálculo vive no servidor para que todos os
 * navegadores usem o mesmo corte D-1, independentemente do relógio local.
 */
export function currentMonthThroughD1Range(now = new Date()) {
  const range = reportingPeriodRange(currentAnalyticsPeriod(now), now);
  return {
    startDate: range.startLabel,
    endDate: range.endLabel,
    hasAvailableDays: range.hasAvailableDays,
  };
}
