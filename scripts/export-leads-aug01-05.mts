import { mkdirSync, writeFileSync } from "node:fs";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { bitrix24Entities, rdStationContacts, rdStationConversionEvents } from "../drizzle/schema";
import { getDb, rdEventUtmValues } from "../server/db";

const start = new Date("2026-08-01T03:00:00.000Z");
const end = new Date("2026-08-06T03:00:00.000Z");
const outputDir = "/home/ubuntu/exports";

const safeJson = (raw: string) => {
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
};

const db = await getDb();
if (!db) throw new Error("Banco de dados indisponível.");

const [events, contacts, bitrixLeads] = await Promise.all([
  db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventUuid: rdStationConversionEvents.eventUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, eventFamily: rdStationConversionEvents.eventFamily, eventIdentifier: rdStationConversionEvents.eventIdentifier, rawPayload: rdStationConversionEvents.rawPayload })
    .from(rdStationConversionEvents)
    .where(and(gte(rdStationConversionEvents.eventCreatedAt, start), lt(rdStationConversionEvents.eventCreatedAt, end))),
  db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, name: rdStationContacts.name, email: rdStationContacts.email, phone: rdStationContacts.phone, createdAtRd: rdStationContacts.createdAtRd, lastConversionAt: rdStationContacts.lastConversionAt })
    .from(rdStationContacts)
    .where(inArray(rdStationContacts.accountKey, ["medsystems", "beautysystems"])),
  db.select({ bitrixId: bitrix24Entities.bitrixId, title: bitrix24Entities.title, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, stageOrStatus: bitrix24Entities.stageOrStatus, createdAtBitrix: bitrix24Entities.createdAtBitrix, updatedAtBitrix: bitrix24Entities.updatedAtBitrix, rawPayload: bitrix24Entities.rawPayload })
    .from(bitrix24Entities)
    .where(and(eq(bitrix24Entities.portal, "medsystems.bitrix24.com.br"), eq(bitrix24Entities.entityType, "lead"), gte(bitrix24Entities.createdAtBitrix, start), lt(bitrix24Entities.createdAtBitrix, end))),
]);

const contactByKey = new Map(contacts.map(contact => [`${contact.accountKey}:${contact.contactUuid}`, contact]));
const firstEventByContact = new Map<string, typeof events[number]>();
for (const event of events.sort((a, b) => a.eventCreatedAt.getTime() - b.eventCreatedAt.getTime())) {
  const key = `${event.accountKey}:${event.contactUuid}`;
  if (!firstEventByContact.has(key)) firstEventByContact.set(key, event);
}

const rdRows = Array.from(firstEventByContact.values()).map(event => {
  const contact = contactByKey.get(`${event.accountKey}:${event.contactUuid}`);
  const utm = rdEventUtmValues(event.rawPayload);
  return {
    marca: event.accountKey,
    contato_uuid: event.contactUuid,
    nome: contact?.name ?? null,
    email: contact?.email ?? null,
    telefone: contact?.phone ?? null,
    criado_no_rd: contact?.createdAtRd ?? null,
    ultima_conversao_rd: contact?.lastConversionAt ?? null,
    evento_uuid: event.eventUuid,
    data_evento: event.eventCreatedAt,
    familia_evento: event.eventFamily,
    identificador_evento: event.eventIdentifier,
    utm_source: utm.utmSource,
    utm_campaign: utm.utmCampaign,
    utm_content: utm.utmContent,
    utm_term: utm.utmTerm,
    utm_id: utm.mediaCampaignId,
  };
});

const bitrixRows = bitrixLeads.map(lead => {
  const payload = safeJson(lead.rawPayload);
  return {
    bitrix_lead_id: lead.bitrixId,
    titulo: lead.title,
    nome: lead.fullName,
    email: lead.email,
    telefone: lead.phone,
    data_criacao_bitrix: lead.createdAtBitrix,
    data_atualizacao_bitrix: lead.updatedAtBitrix,
    status: lead.stageOrStatus,
    origem_bitrix: payload.SOURCE_ID ?? null,
    utm_source: payload.UTM_SOURCE ?? null,
    utm_medium: payload.UTM_MEDIUM ?? null,
    utm_campaign: payload.UTM_CAMPAIGN ?? null,
    utm_content: payload.UTM_CONTENT ?? null,
    utm_term: payload.UTM_TERM ?? null,
    contact_id: payload.CONTACT_ID ?? null,
  };
});

mkdirSync(outputDir, { recursive: true });
writeFileSync(`${outputDir}/leads_2026-08-01_a_05.json`, JSON.stringify({ rdRows, bitrixRows }, null, 2));
console.log(JSON.stringify({ rdContacts: rdRows.length, bitrixLeads: bitrixRows.length, output: `${outputDir}/leads_2026-08-01_a_05.json` }, null, 2));
process.exit(0);
