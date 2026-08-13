import { refreshAttributionAuditFromBitrix } from "../server/db.ts";

const refreshed = await refreshAttributionAuditFromBitrix({
  brand: "medsystems",
  portal: "medsystems.bitrix24.com.br",
  start: new Date("2026-07-01T00:00:00-03:00"),
  end: new Date("2026-08-01T00:00:00-03:00"),
});

console.log(JSON.stringify({ refreshed }, null, 2));
