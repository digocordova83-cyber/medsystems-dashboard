import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const START = "2026-08-01 03:00:00";
const END = "2026-08-25 03:00:00";
const OUTPUT = "/tmp/bitrix-rd-crossmatch-2026-08-01-a-2026-08-24.json";
const first = (...values) => values.map(value => value == null ? "" : String(value).trim()).find(Boolean) ?? "";
const digits = value => first(value).replace(/\D/g, "");
const normalizeEmail = value => first(value).toLowerCase();
const phoneKey = value => { const d = digits(value); return d.length >= 10 ? d.slice(-11) : d; };
const isUseful = value => { const v = first(value).toLowerCase(); return Boolean(v && !["undefined", "null", "(not set)", "na", "n/a"].includes(v)); };
function valuesFor(payload, keys) {
  const values = [];
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) for (const item of value) values.push(typeof item === "object" ? first(item?.VALUE, item?.value, item?.EMAIL, item?.PHONE) : item);
    else if (value && typeof value === "object") values.push(first(value.VALUE, value.value, value.EMAIL, value.PHONE));
    else values.push(value);
  }
  return values.filter(isUseful);
}
function parsePayload(raw) { try { return JSON.parse(raw); } catch { return {}; } }
function utms(payload) {
  return {
    source: first(payload.UTM_SOURCE),
    medium: first(payload.UTM_MEDIUM),
    campaign: first(payload.UTM_CAMPAIGN),
    content: first(payload.UTM_CONTENT),
    term: first(payload.UTM_TERM),
  };
}
function hasUtm(utm) { return Object.values(utm).some(isUseful); }
function eventPayload(raw) { const parsed = parsePayload(raw); return parsed?.payload && typeof parsed.payload === "object" ? parsed.payload : {}; }
function eventUtms(payload) {
  const direct = {
    source: first(payload.cf_utm_source_real, payload.cf_utm_source, payload.utm_source),
    medium: first(payload.cf_utm_medium_real, payload.cf_utm_medium, payload.utm_medium),
    campaign: first(payload.cf_utm_campaign_real, payload.cf_utm_campaign, payload.utm_campaign),
    content: first(payload.cf_utm_content_real, payload.cf_utm_content, payload.utm_content),
    term: first(payload.cf_utm_term_real, payload.cf_utm_term, payload.utm_term),
  };
  return direct;
}
function classify(row, rdContact, rdEvents) {
  if (!rdContact) return "Bitrix com UTM; não encontrado no RD Station por e-mail ou telefone";
  if (!rdEvents.length) return "Bitrix com UTM; contato encontrado no RD Station, mas sem evento no período";
  const marketingEvents = rdEvents.filter(event => hasUtm(event.utm) && !event.importation);
  if (marketingEvents.length) return "Match comprovado: Bitrix com UTM + contato/evento RD com UTM";
  return "Contato/evento RD encontrado; UTM de marketing não comprovada no evento";
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não disponível");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [bitrixRows] = await db.query(`SELECT bitrixId, title, fullName, email, phone, createdAtBitrix, stageOrStatus, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?`, [START, END]);
  const [rdRows] = await db.query(`SELECT accountKey, contactUuid, name, email, phone, createdAtRd, lastConversionAt FROM rdStationContacts WHERE (createdAtRd >= ? AND createdAtRd < ?) OR (lastConversionAt >= ? AND lastConversionAt < ?)`, [START, END, START, END]);
  const [eventRows] = await db.query(`SELECT accountKey, contactUuid, eventUuid, eventType, eventFamily, eventIdentifier, eventCreatedAt, rawPayload FROM rdStationConversionEvents WHERE eventCreatedAt >= ? AND eventCreatedAt < ? ORDER BY eventCreatedAt ASC`, [START, END]);
  const rdByEmail = new Map();
  const rdByPhone = new Map();
  const rdContactsByKey = new Map();
  for (const rd of rdRows) {
    const key = `${rd.accountKey}:${rd.contactUuid}`;
    const contact = { ...rd, emailKey: normalizeEmail(rd.email), phoneKey: phoneKey(rd.phone) };
    rdContactsByKey.set(key, contact);
    if (contact.emailKey) (rdByEmail.get(contact.emailKey) ?? rdByEmail.set(contact.emailKey, []).get(contact.emailKey)).push(contact);
    if (contact.phoneKey) (rdByPhone.get(contact.phoneKey) ?? rdByPhone.set(contact.phoneKey, []).get(contact.phoneKey)).push(contact);
  }
  const eventsByKey = new Map();
  for (const event of eventRows) {
    const key = `${event.accountKey}:${event.contactUuid}`;
    const p = eventPayload(event.rawPayload);
    const utm = eventUtms(p);
    const marker = [event.eventFamily, event.eventIdentifier, p.conversion_identifier, p.resource].filter(Boolean).join(" ").toLowerCase();
    const item = { ...event, utm, importation: /(importa[cç][aã]o|importation|imported|csv_import|bulk_import)/.test(marker) };
    const list = eventsByKey.get(key) ?? [];
    list.push(item);
    eventsByKey.set(key, list);
    const emails = valuesFor(p, ["email", "EMAIL"]);
    const phones = valuesFor(p, ["mobile_phone", "personal_phone", "phone", "phone_number", "PHONE"]);
    for (const email of emails) {
      const emailKey = normalizeEmail(email);
      if (emailKey && !rdByEmail.has(emailKey)) rdByEmail.set(emailKey, []);
      if (emailKey && !rdByEmail.get(emailKey).some(c => c.contactUuid === event.contactUuid && c.accountKey === event.accountKey)) rdByEmail.get(emailKey).push({ accountKey: event.accountKey, contactUuid: event.contactUuid, email: emailKey, phone: phones[0] ?? "", emailKey, phoneKey: phoneKey(phones[0]) });
    }
    for (const phone of phones) {
      const phoneKeyValue = phoneKey(phone);
      if (phoneKeyValue && !rdByPhone.has(phoneKeyValue)) rdByPhone.set(phoneKeyValue, []);
      if (phoneKeyValue && !rdByPhone.get(phoneKeyValue).some(c => c.contactUuid === event.contactUuid && c.accountKey === event.accountKey)) rdByPhone.get(phoneKeyValue).push({ accountKey: event.accountKey, contactUuid: event.contactUuid, email: emails[0] ?? "", phone, emailKey: normalizeEmail(emails[0]), phoneKey: phoneKeyValue });
    }
  }
  const rows = [];
  for (const bitrix of bitrixRows) {
    const payload = parsePayload(bitrix.rawPayload);
    if (first(bitrix.title, payload.TITLE) !== "Oportunidade do RD Station") continue;
    const bitrixEmails = [...valuesFor(payload, ["EMAIL", "email"]), bitrix.email].filter(isUseful).map(normalizeEmail);
    const bitrixPhones = [...valuesFor(payload, ["PHONE", "MOBILE_PHONE", "PERSONAL_PHONE", "mobile_phone", "phone"]), bitrix.phone].filter(isUseful).map(phoneKey).filter(Boolean);
    const bitrixUtm = utms(payload);
    if (!hasUtm(bitrixUtm)) continue;
    const emailMatches = bitrixEmails.flatMap(email => rdByEmail.get(email) ?? []);
    const phoneMatches = bitrixPhones.flatMap(phone => rdByPhone.get(phone) ?? []);
    const matches = new Map();
    for (const match of [...emailMatches, ...phoneMatches]) matches.set(`${match.accountKey}:${match.contactUuid}`, { ...match, matchByEmail: emailMatches.some(m => m.accountKey === match.accountKey && m.contactUuid === match.contactUuid), matchByPhone: phoneMatches.some(m => m.accountKey === match.accountKey && m.contactUuid === match.contactUuid) });
    const matchList = [...matches.values()];
    const primary = matchList[0];
    const rdEvents = primary ? eventsByKey.get(`${primary.accountKey}:${primary.contactUuid}`) ?? [] : [];
    const rdUtmEvent = rdEvents.find(event => hasUtm(event.utm) && !event.importation) ?? rdEvents.at(-1);
    const matchStatus = classify(bitrix, primary, rdEvents);
    rows.push({
      bitrix_id: String(bitrix.bitrixId),
      nome_bitrix: first(bitrix.fullName, payload.NAME, payload.LAST_NAME ? `${payload.NAME ?? ""} ${payload.LAST_NAME}` : ""),
      email_bitrix: bitrixEmails[0] ?? "",
      telefone_bitrix: bitrixPhones[0] ?? "",
      data_criacao_bitrix: bitrix.createdAtBitrix ? new Date(bitrix.createdAtBitrix).toISOString() : "",
      etapa_bitrix: first(bitrix.stageOrStatus, payload.STATUS_ID),
      origem_bitrix: first(payload.SOURCE_DESCRIPTION, payload.SOURCE_ID),
      pipeline_bitrix: first(payload.UF_CRM_1739195085),
      utm_source_bitrix: bitrixUtm.source,
      utm_medium_bitrix: bitrixUtm.medium,
      utm_campaign_bitrix: bitrixUtm.campaign,
      utm_content_bitrix: bitrixUtm.content,
      utm_term_bitrix: bitrixUtm.term,
      rd_conta_match: primary?.accountKey ?? "",
      rd_contact_uuid_match: primary?.contactUuid ?? "",
      rd_nome_match: primary?.name ?? "",
      rd_email_match: primary?.email ?? "",
      rd_telefone_match: primary?.phone ?? "",
      metodo_match: primary ? [primary.matchByEmail ? "email" : "", primary.matchByPhone ? "telefone" : ""].filter(Boolean).join(" + ") : "",
      quantidade_matches_rd: matchList.length,
      rd_eventos_no_periodo: rdEvents.length,
      rd_evento_utm: rdUtmEvent?.eventIdentifier ?? "",
      rd_data_evento_utm: rdUtmEvent?.eventCreatedAt ? new Date(rdUtmEvent.eventCreatedAt).toISOString() : "",
      utm_source_rd: rdUtmEvent?.utm.source ?? "",
      utm_medium_rd: rdUtmEvent?.utm.medium ?? "",
      utm_campaign_rd: rdUtmEvent?.utm.campaign ?? "",
      utm_content_rd: rdUtmEvent?.utm.content ?? "",
      utm_term_rd: rdUtmEvent?.utm.term ?? "",
      status_cruzamento: matchStatus,
    });
  }
  await fs.writeFile(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), period: "01/08/2026 a 24/08/2026 BRT", rule: "Bitrix lead com título exato Oportunidade do RD Station e ao menos uma UTM preenchida; match por e-mail e/ou telefone normalizados contra RD Station", rows }, null, 2));
  const summary = {};
  for (const row of rows) {
    const key = row.rd_conta_match || "sem_match_rd";
    summary[key] ??= { total: 0, comprovado: 0, semEvento: 0, semUtmRd: 0, semMatch: 0 };
    summary[key].total += 1;
    if (row.status_cruzamento.startsWith("Match comprovado")) summary[key].comprovado += 1;
    else if (row.status_cruzamento.includes("sem evento")) summary[key].semEvento += 1;
    else if (row.status_cruzamento.includes("UTM de marketing não comprovada")) summary[key].semUtmRd += 1;
    else summary[key].semMatch += 1;
  }
  console.log(JSON.stringify({ bitrixLeadsScanned: bitrixRows.length, leadsBitrixComUtmAndTitulo: rows.length, summary, output: OUTPUT }, null, 2));
} finally { await db.end(); }
