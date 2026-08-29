import { and, gte, inArray, lt } from "drizzle-orm";
import { rdStationConversionEvents } from "../drizzle/schema";
import { getDb, rdEventUtmValues } from "../server/db";
import { writeFile } from "node:fs/promises";

type Brand = "medsystems" | "beautysystems";
const brands = ["medsystems", "beautysystems"] as const;

async function period(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");
  const start = new Date(`${startDate}T00:00:00-03:00`);
  const endExclusive = new Date(`${endDate}T00:00:00-03:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  const rows = await db.select({
    accountKey: rdStationConversionEvents.accountKey,
    contactUuid: rdStationConversionEvents.contactUuid,
    eventCreatedAt: rdStationConversionEvents.eventCreatedAt,
    rawPayload: rdStationConversionEvents.rawPayload,
  }).from(rdStationConversionEvents).where(and(
    inArray(rdStationConversionEvents.accountKey, brands),
    gte(rdStationConversionEvents.eventCreatedAt, start),
    lt(rdStationConversionEvents.eventCreatedAt, endExclusive),
  ));

  const converted = new Map<string, { brand: Brand; at: Date }>();
  const withUtm = new Map<string, { brand: Brand; at: Date }>();
  for (const row of rows) {
    const key = `${row.accountKey}:${row.contactUuid}`;
    const current = converted.get(key);
    if (!current || row.eventCreatedAt < current.at) converted.set(key, { brand: row.accountKey, at: row.eventCreatedAt });
    if (!rdEventUtmValues(row.rawPayload).utmSource) continue;
    const currentUtm = withUtm.get(key);
    if (!currentUtm || row.eventCreatedAt < currentUtm.at) withUtm.set(key, { brand: row.accountKey, at: row.eventCreatedAt });
  }

  const result = {
    startDate,
    endDate,
    medsystems: { convertedContacts: 0, utmLeads: 0 },
    beautysystems: { convertedContacts: 0, utmLeads: 0 },
  };
  for (const item of converted.values()) result[item.brand].convertedContacts += 1;
  for (const item of withUtm.values()) result[item.brand].utmLeads += 1;
  return result;
}

async function main() {
  const output = {
    generatedAt: new Date().toISOString(),
    july: await period("2026-07-01", "2026-07-26"),
    august: await period("2026-08-01", "2026-08-26"),
  };
  await writeFile("/tmp/ceo_rd_audit.json", JSON.stringify(output, null, 2), "utf8");
  console.log("Auditoria concluída: /tmp/ceo_rd_audit.json");
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
