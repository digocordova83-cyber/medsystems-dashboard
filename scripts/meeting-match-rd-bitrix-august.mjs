import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const START = "2026-08-01 03:00:00";
const END = "2026-08-24 03:00:00";
const OUTPUT = "/tmp/meeting-match-rd-bitrix-2026-08-01-a-2026-08-23.json";
const first = (...values) => values.map(value => value == null ? "" : String(value).trim()).find(Boolean) ?? "";
const useful = value => { const v = first(value); return Boolean(v && !["undefined", "null", "(not set)", "na", "n/a"].includes(v.toLowerCase())); };
const emailKey = value => first(value).toLowerCase();
const phoneKey = value => { const d = first(value).replace(/\D/g, ""); return d.length >= 10 ? d.slice(-11) : ""; };
const nameKey = value => first(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function parse(raw) { try { return JSON.parse(raw); } catch { return {}; } }
function walk(value, path = "", out = []) {
  if (value == null) return out;
  if (Array.isArray(value)) { value.forEach((item, index) => walk(item, `${path}[${index}]`, out)); return out; }
  if (typeof value === "object") { for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key, out); return out; }
  out.push({ path, key: path.split(".").at(-1)?.replace(/\[\d+\]$/, "") ?? "", value: String(value) });
  return out;
}
function findValues(payload, matcher) { return walk(payload).filter(item => matcher(item.key, item.value, item.path)).map(item => item.value).filter(useful); }
function unique(values) { return [...new Set(values.filter(useful))]; }
function sourceAndUtm(payload) {
  const fields = Object.fromEntries(walk(payload).map(item => [item.key.toLowerCase(), item.value]));
  const utm = {
    source: first(fields.utm_source, fields.cf_utm_source_real, fields.cf_utm_source),
    medium: first(fields.utm_medium, fields.cf_utm_medium_real, fields.cf_utm_medium),
    campaign: first(fields.utm_campaign, fields.cf_utm_campaign_real, fields.cf_utm_campaign),
    content: first(fields.utm_content, fields.cf_utm_content_real, fields.cf_utm_content),
    term: first(fields.utm_term, fields.cf_utm_term_real, fields.cf_utm_term),
  };
  return { source: first(fields.source_description, fields.source, fields.conversion_origin), utm };
}
function rdContactFields(contact, events) {
  const contactPayload = parse(contact.rawPayload);
  const eventPayloads = events.map(event => parse(event.rawPayload));
  const allPayloads = [contactPayload, ...eventPayloads];
  const emails = unique(allPayloads.flatMap(payload => findValues(payload, (key, value) => /email/i.test(key) && /@/.test(value))));
  const phones = unique(allPayloads.flatMap(payload => findValues(payload, (key, value) => /phone|celular|telefone|mobile|personal/i.test(key) && /\d{8,}/.test(value))));
  const names = unique(allPayloads.flatMap(payload => findValues(payload, key => /^(name|nome)$/i.test(key))));
  const latestEvent = events.at(-1);
  const latestPayload = latestEvent ? parse(latestEvent.rawPayload) : {};
  const latestData = sourceAndUtm(latestPayload);
  const utmEvent = [...events].reverse().find(event => {
    const data = sourceAndUtm(parse(event.rawPayload));
    return Object.values(data.utm).some(useful);
  });
  const utmData = utmEvent ? sourceAndUtm(parse(utmEvent.rawPayload)) : latestData;
  return {
    accountKey: contact.accountKey,
    contactUuid: contact.contactUuid,
    name: first(contact.name, names[0]),
    email: first(contact.email, emails[0]),
    phone: first(contact.phone, phones[0]),
    createdAtRd: contact.createdAtRd ? new Date(contact.createdAtRd).toISOString() : "",
    lastConversionAt: contact.lastConversionAt ? new Date(contact.lastConversionAt).toISOString() : "",
    rdEventCount: events.length,
    rdLastEventIdentifier: first(latestEvent?.eventIdentifier),
    rdLastEventAt: latestEvent?.eventCreatedAt ? new Date(latestEvent.eventCreatedAt).toISOString() : "",
    rdUtmEventAt: utmEvent?.eventCreatedAt ? new Date(utmEvent.eventCreatedAt).toISOString() : "",
    utm_source_rd: utmData.utm.source,
    utm_medium_rd: utmData.utm.medium,
    utm_campaign_rd: utmData.utm.campaign,
    utm_content_rd: utmData.utm.content,
    utm_term_rd: utmData.utm.term,
    origem_rd: latestData.source,
    emailKeys: unique(emails.map(emailKey)),
    phoneKeys: unique(phones.map(phoneKey)),
    nameKeys: unique(names.map(nameKey)),
  };
}
function bitrixFields(bitrix, payload) {
  const scalar = walk(payload).filter(item => item.value.length <= 1000);
  const raw = String(bitrix.rawPayload ?? "");
  const rawEmails = [...raw.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(match => match[0]);
  const rawPhones = [...raw.matchAll(/(?:phone_lead|mobile_phone|personal_phone|phone|celular|telefone)["']?\s*:\s*["']([^"']+)["']/gi)].map(match => match[1]);
  const emails = unique([bitrix.email, ...rawEmails, ...findValues(payload, (key, value) => /email/i.test(key) && /@/.test(value))]);
  const phones = unique([bitrix.phone, ...rawPhones, ...findValues(payload, (key, value) => /phone|celular|telefone|mobile|personal/i.test(key) && /\d{8,}/.test(value))]);
  const names = unique([bitrix.fullName, payload.NAME, payload.Nome, [payload.NAME, payload.LAST_NAME].filter(Boolean).join(" "), ...findValues(payload, key => /^(name|nome)$/i.test(key))]);
  const data = sourceAndUtm(payload);
  return {
    emailKeys: unique(emails.map(emailKey)), phoneKeys: unique(phones.map(phoneKey)), nameKeys: unique(names.map(nameKey)), emails, phones, names,
    utm: data.utm, source: data.source, scalarFields: scalar,
  };
}
function addIndex(map, values, record) { for (const value of values) if (value) { const list = map.get(value) ?? []; list.push(record); map.set(value, list); } }
function dedupe(records) { return [...new Map(records.map(record => [`${record.portal}:${record.bitrixId}`, record])).values()]; }
function classify(match, rd) {
  if (!match) return "RD sem correspondência no Bitrix24";
  const methods = match.matchMethods ?? [...(match.methods ?? [])];
  if (methods.includes("email") || methods.includes("telefone")) return "Correspondência forte no Bitrix24 por e-mail/telefone";
  if (methods.includes("nome") && match.ambiguous) return "Correspondência ambígua por nome";
  return "Correspondência por nome no Bitrix24";
}

const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rdContacts] = await db.query(`SELECT accountKey, contactUuid, name, email, phone, createdAtRd, lastConversionAt, rawPayload FROM rdStationContacts WHERE (createdAtRd >= ? AND createdAtRd < ?) OR (lastConversionAt >= ? AND lastConversionAt < ?)`, [START, END, START, END]);
  const [rdEvents] = await db.query(`SELECT accountKey, contactUuid, eventIdentifier, eventCreatedAt, rawPayload FROM rdStationConversionEvents WHERE eventCreatedAt >= ? AND eventCreatedAt < ? ORDER BY eventCreatedAt ASC`, [START, END]);
  const [bitrixRows] = await db.query(`SELECT id, portal, entityType, bitrixId, title, fullName, email, phone, stageOrStatus, createdAtBitrix, updatedAtBitrix, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= ? AND createdAtBitrix < ?`, [START, END]);
  const eventsByContact = new Map();
  for (const event of rdEvents) { const key = `${event.accountKey}:${event.contactUuid}`; const list = eventsByContact.get(key) ?? []; list.push(event); eventsByContact.set(key, list); }
  const rdBase = rdContacts.map(contact => rdContactFields(contact, eventsByContact.get(`${contact.accountKey}:${contact.contactUuid}`) ?? []));
  const emailIndex = new Map(), phoneIndex = new Map(), nameIndex = new Map();
  const bitrixNormalized = bitrixRows.map(bitrix => ({ bitrix, payload: parse(bitrix.rawPayload), fields: bitrixFields(bitrix, parse(bitrix.rawPayload)) }));
  for (const item of bitrixNormalized) { addIndex(emailIndex, item.fields.emailKeys, item); addIndex(phoneIndex, item.fields.phoneKeys, item); addIndex(nameIndex, item.fields.nameKeys, item); }
  const rows = [];
  for (const rd of rdBase) {
    const byKey = new Map();
    for (const item of rd.emailKeys.flatMap(key => emailIndex.get(key) ?? [])) byKey.set(`${item.bitrix.portal}:${item.bitrix.bitrixId}`, { ...item, methods: new Set([...(byKey.get(`${item.bitrix.portal}:${item.bitrix.bitrixId}`)?.methods ?? []), "email"]) });
    for (const item of rd.phoneKeys.flatMap(key => phoneIndex.get(key) ?? [])) byKey.set(`${item.bitrix.portal}:${item.bitrix.bitrixId}`, { ...item, methods: new Set([...(byKey.get(`${item.bitrix.portal}:${item.bitrix.bitrixId}`)?.methods ?? []), "telefone"]) });
    for (const item of rd.nameKeys.flatMap(key => nameIndex.get(key) ?? [])) byKey.set(`${item.bitrix.portal}:${item.bitrix.bitrixId}`, { ...item, methods: new Set([...(byKey.get(`${item.bitrix.portal}:${item.bitrix.bitrixId}`)?.methods ?? []), "nome"]) });
    const candidates = [...byKey.values()];
    const ambiguousName = candidates.length > 1 && candidates.every(item => [...item.methods].every(method => method === "nome"));
    if (!candidates.length) {
      rows.push({ rd, match: null, status: classify(null, rd) });
      continue;
    }
    const strongest = candidates.sort((a, b) => { const weight = item => [...item.methods].reduce((n, method) => n + (method === "email" ? 4 : method === "telefone" ? 3 : 1), 0); return weight(b) - weight(a); })[0];
    rows.push({ rd, match: { bitrixId: String(strongest.bitrix.bitrixId), entityType: strongest.bitrix.entityType, portal: strongest.bitrix.portal, title: strongest.bitrix.title, fullName: strongest.bitrix.fullName, email: strongest.bitrix.email, phone: strongest.bitrix.phone, stageOrStatus: strongest.bitrix.stageOrStatus, createdAtBitrix: strongest.bitrix.createdAtBitrix, updatedAtBitrix: strongest.bitrix.updatedAtBitrix, rawPayload: strongest.bitrix.rawPayload, fields: strongest.fields, matchMethods: [...strongest.methods], candidateCount: candidates.length, ambiguous: ambiguousName }, status: classify(strongest, rd) });
  }
  await fs.writeFile(OUTPUT, JSON.stringify({ generatedAt: new Date().toISOString(), period: "01/08/2026 a 23/08/2026 BRT", rule: "RD Station como base; match Bitrix por e-mail, telefone e nome normalizados; eventos/importações preservados para classificação", rdBase, rows }, null, 2));
  const summary = { rdLeads: rows.length, encontrados: rows.filter(row => row.match).length, semCorrespondencia: rows.filter(row => !row.match).length, forteEmailTelefone: rows.filter(row => row.match?.matchMethods.some(method => method === "email" || method === "telefone")).length, somenteNome: rows.filter(row => row.match && row.match.matchMethods.length === 1 && row.match.matchMethods[0] === "nome").length, ambiguos: rows.filter(row => row.match?.ambiguous).length, porConta: {} };
  for (const row of rows) { const key = row.rd.accountKey; summary.porConta[key] ??= { rd: 0, encontrados: 0, semCorrespondencia: 0 }; summary.porConta[key].rd++; if (row.match) summary.porConta[key].encontrados++; else summary.porConta[key].semCorrespondencia++; }
  console.log(JSON.stringify({ bitrixLeadsScanned: bitrixRows.length, summary, output: OUTPUT }, null, 2));
} finally { await db.end(); }
