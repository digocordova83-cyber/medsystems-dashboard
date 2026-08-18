import { fetchSegmentations } from "../server/rdstation/service.ts";

for (const accountKey of ["medsystems", "beautysystems"]) {
  const items = await fetchSegmentations(accountKey);
  const august = items.filter(item => /ago|aug|08\/?2026|2026-08/i.test(item.name));
  console.log(JSON.stringify({ accountKey, total: items.length, august }, null, 2));
}
