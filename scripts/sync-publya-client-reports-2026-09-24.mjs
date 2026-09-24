import { syncPublyaPeriod } from "../server/publya/service.ts";

const periods = [
  { label: "2026-08", startDate: "2026-08-01", endDate: "2026-08-31" },
  { label: "2026-09", startDate: "2026-09-01", endDate: "2026-09-23" },
];

const results = [];
for (const period of periods) {
  console.error(
    `[Publya] sincronizando ${period.label}: ${period.startDate} a ${period.endDate}`
  );
  results.push({
    period: period.label,
    ...(await syncPublyaPeriod(period.startDate, period.endDate)),
  });
}
console.log(
  JSON.stringify(
    { generatedAt: new Date().toISOString(), periods: results },
    null,
    2
  )
);
