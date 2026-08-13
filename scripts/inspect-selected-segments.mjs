import { fetchSegmentations } from "../server/rdstation/service.ts";

const selected = {
  medsystems: "568976",
  beautysystems: "12510116",
};

const output = {};
for (const [accountKey, selectedId] of Object.entries(selected)) {
  const segmentations = await fetchSegmentations(accountKey);
  output[accountKey] = {
    selected: segmentations.find(segment => segment.id === selectedId) ?? null,
    julyCandidates: segmentations.filter(segment => /jul|07\/?2026|2026.*07/i.test(segment.name)).slice(0, 25),
    totalSegmentations: segmentations.length,
  };
}

console.log(JSON.stringify(output, null, 2));
process.exit(0);
