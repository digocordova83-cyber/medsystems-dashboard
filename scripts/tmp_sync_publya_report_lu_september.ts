import { syncPublyaPeriod } from "../server/publya/service";

const result = await syncPublyaPeriod("2026-09-01", "2026-09-07");
console.log(JSON.stringify({
  campaigns: result.campaigns,
  pushRows: result.pushRows,
  lastDataDate: result.lastDataDate,
}, null, 2));

process.exit(0);
