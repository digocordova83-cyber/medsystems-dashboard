import { reconcilePaidMediaBusinessDate } from "../server/leads/dailyReconciliation";

reconcilePaidMediaBusinessDate(process.argv[2] ?? "2026-09-01")
  .then(result => { console.log(JSON.stringify(result)); process.exit(0); })
  .catch(error => { console.error(error); process.exit(1); });
