import { fetchSegmentations } from "../server/rdstation/service.ts";

for (const accountKey of ["medsystems", "beautysystems"]) {
  const items = await fetchSegmentations(accountKey);
  const august = items.filter(item => /ago|aug|08\/?2026|2026-08/i.test(item.name));
  const query = process.env.SEGMENT_QUERY?.trim();
  const matches = query ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase())) : [];
  const configuredId = accountKey === "medsystems" ? "568976" : "12510116";
  const configured = items.find(item => item.id === configuredId) ?? null;
  console.log(JSON.stringify({ accountKey, total: items.length, configured, august, matches }, null, 2));
}
