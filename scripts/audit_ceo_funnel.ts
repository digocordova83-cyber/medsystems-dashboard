import { and, eq, gte, like, lt } from "drizzle-orm";
import { bitrix24Entities } from "../drizzle/schema";
import { getDb } from "../server/db";
import {
  buildRdOpportunityManagerDashboard,
  PAID_TRAFFIC_FIELD,
  PAID_TRAFFIC_VALUE,
  type RdOpportunityFilters,
} from "../server/bitrix24/rdOpportunityAnalytics";
import { writeFile } from "node:fs/promises";

const filters = (pipeline: string): RdOpportunityFilters => ({
  pipeline,
  responsible: "all",
  source: "all",
  stage: "all",
  position: "all",
  product: "all",
  campaign: "all",
  adset: "all",
  creative: "all",
});

const portal = "medsystems.bitrix24.com.br";

async function period(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const start = new Date(`${startDate}T00:00:00-03:00`);
  const endExclusive = new Date(`${endDate}T00:00:00-03:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const [rows, dealRows] = await Promise.all([
    db.select({
      bitrixId: bitrix24Entities.bitrixId,
      createdAtBitrix: bitrix24Entities.createdAtBitrix,
      stageOrStatus: bitrix24Entities.stageOrStatus,
      rawPayload: bitrix24Entities.rawPayload,
    }).from(bitrix24Entities).where(and(
      eq(bitrix24Entities.portal, portal),
      eq(bitrix24Entities.entityType, "lead"),
      gte(bitrix24Entities.createdAtBitrix, start),
      lt(bitrix24Entities.createdAtBitrix, endExclusive),
      like(bitrix24Entities.rawPayload, `%"${PAID_TRAFFIC_FIELD}":"${PAID_TRAFFIC_VALUE}"%`),
    )),
    db.select({ rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, portal), eq(bitrix24Entities.entityType, "deal"))),
  ]);

  const summarize = (pipeline: string) => {
    const report = buildRdOpportunityManagerDashboard({
      rows,
      dealRows,
      filters: filters(pipeline),
      period: { start: startDate, end: endDate },
    });
    return {
      totals: report.totals,
      funnel: report.funnel,
      coverage: report.coverage,
      methodology: report.methodology,
    };
  };

  return {
    startDate,
    endDate,
    allPaidTraffic: summarize("all"),
    medsystems: summarize("15391"),
    beautysystems: summarize("15395"),
  };
}

async function main() {
  const output = {
    generatedAt: new Date().toISOString(),
    july: await period("2026-07-01", "2026-07-30"),
    august: await period("2026-08-01", "2026-08-30"),
  };
  await writeFile("/tmp/ceo_funnel_audit.json", JSON.stringify(output, null, 2), "utf8");
  console.log("Auditoria concluída: /tmp/ceo_funnel_audit.json");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
