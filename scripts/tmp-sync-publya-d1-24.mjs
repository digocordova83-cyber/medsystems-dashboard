import { syncPublyaPeriod } from "../server/publya/service.ts";

try {
  const result = await syncPublyaPeriod("2026-09-01", "2026-09-24");
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
}
