import { syncDirectJulyViewBatch } from "../server/rdstation/service.ts";

const accountKey = process.env.RD_JULY_ACCOUNT ?? "medsystems";
const viewType = process.env.RD_JULY_VIEW ?? "primeira";
const batchSize = Number(process.env.RD_JULY_BATCH_SIZE ?? 10);

const result = await syncDirectJulyViewBatch(accountKey, viewType, batchSize);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
