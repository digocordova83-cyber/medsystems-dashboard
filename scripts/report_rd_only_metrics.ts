import { and, gte, lt, inArray } from "drizzle-orm";
import { getDb, rdEventUtmValues } from "../server/db";
import { rdStationConversionEvents } from "../drizzle/schema";

const db = await getDb();
if (!db) throw new Error("Banco indisponível");
const start = new Date("2026-07-01T00:00:00-03:00");
const end = new Date("2026-08-27T00:00:00-03:00");
const events = await db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, rawPayload: rdStationConversionEvents.rawPayload, eventIdentifier: rdStationConversionEvents.eventIdentifier, eventFamily: rdStationConversionEvents.eventFamily }).from(rdStationConversionEvents).where(and(inArray(rdStationConversionEvents.accountKey, ["medsystems", "beautysystems"]), gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end)));

function periodOf(d: Date) { return d < new Date("2026-08-01T00:00:00-03:00") ? "2026-07" : "2026-08-MTD"; }
function details(raw: string) { return rdEventUtmValues(raw); }
function empty() { return { convertedContacts: 0, utmLeads: 0, withMedium: 0, withCampaign: 0, withContent: 0, withTerm: 0, sources: {} as Record<string, number>, mediums: {} as Record<string, number>, campaigns: {} as Record<string, number>, eventTypes: {} as Record<string, number> }; }
const result: Record<string, Record<string, ReturnType<typeof empty>>> = { "2026-07": { medsystems: empty(), beautysystems: empty() }, "2026-08-MTD": { medsystems: empty(), beautysystems: empty() } };
for (const period of Object.keys(result)) {
  for (const accountKey of ["medsystems", "beautysystems"] as const) {
    const scoped = events.filter(e => e.accountKey === accountKey && periodOf(e.eventCreatedAt) === period);
    const first = new Map<string, typeof scoped[number]>();
    const firstUtm = new Map<string, typeof scoped[number]>();
    for (const e of scoped) {
      const key = e.contactUuid;
      if (!first.has(key) || e.eventCreatedAt < first.get(key)!.eventCreatedAt) first.set(key, e);
      if (details(e.rawPayload).utmSource && (!firstUtm.has(key) || e.eventCreatedAt < firstUtm.get(key)!.eventCreatedAt)) firstUtm.set(key, e);
    }
    const out = result[period][accountKey];
    out.convertedContacts = first.size;
    out.utmLeads = firstUtm.size;
    for (const e of firstUtm.values()) {
      const u = details(e.rawPayload);
      const source = u.utmSource ?? "Não identificado";
      const medium = u.utmMedium ?? "Não identificado";
      const campaign = u.utmCampaign ?? "Não identificado";
      out.sources[source] = (out.sources[source] ?? 0) + 1;
      out.mediums[medium] = (out.mediums[medium] ?? 0) + 1;
      out.campaigns[campaign] = (out.campaigns[campaign] ?? 0) + 1;
      if (u.utmMedium) out.withMedium += 1;
      if (u.utmCampaign) out.withCampaign += 1;
      if (u.utmContent) out.withContent += 1;
      if (u.utmTerm) out.withTerm += 1;
      const type = e.eventIdentifier ?? e.eventFamily ?? "Evento RD com UTM";
      out.eventTypes[type] = (out.eventTypes[type] ?? 0) + 1;
    }
  }
}
console.log(JSON.stringify({ eventRows: events.length, periodNote: "Agosto MTD até 26/08/2026; julho fechado.", result }, null, 2));
