import { writeFile } from "node:fs/promises";
import { programmaticDashboard } from "../server/publya/dashboard";

async function main() {
  const output = await programmaticDashboard({ startDate: "2026-08-01", endDate: "2026-08-28" });
  await writeFile("/tmp/ceo_publya_audit.json", JSON.stringify(output, null, 2), "utf8");
  console.log("Auditoria concluída: /tmp/ceo_publya_audit.json");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
