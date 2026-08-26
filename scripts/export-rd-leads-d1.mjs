import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const CUTOFF_UTC = "2026-08-25 03:00:00"; // 24/08/2026 23:59:59 BRT
const OUTPUT_JSON = "/tmp/rd-leads-ate-2026-08-24.json";

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
function first(...values) {
  return values.map(text).find(Boolean) ?? "";
}
function decodeTrafficSource(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const encoded = raw.startsWith("encoded_") ? raw.slice("encoded_".length) : raw;
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    const source = decoded.current_session?.value ?? decoded.first_session?.value ?? "";
    return typeof source === "string" ? source : "";
  } catch {
    return raw;
  }
}
function queryParams(value) {
  const raw = text(value);
  if (!raw) return {};
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1).split("#")[0] : raw;
  const params = new URLSearchParams(query);
  return Object.fromEntries(params.entries());
}
function payloadOf(event) {
  const parsed = JSON.parse(event.rawPayload);
  return parsed?.payload && typeof parsed.payload === "object" ? parsed.payload : {};
}
function utmData(event) {
  if (!event) return { source: "", medium: "", campaign: "", content: "", term: "", decodedSource: "", landingPage: "", referrer: "" };
  const payload = payloadOf(event);
  const decodedSource = decodeTrafficSource(first(payload.traffic_source, payload.conversion_origin));
  const params = queryParams(decodedSource);
  const direct = key => first(
    payload[`cf_utm_${key}_real`],
    payload[`cf_utm_${key}`],
    payload[`utm_${key}`],
    params[`utm_${key}`],
  );
  return {
    source: direct("source"),
    medium: direct("medium"),
    campaign: direct("campaign"),
    content: direct("content"),
    term: direct("term"),
    decodedSource,
    landingPage: first(payload.cf_landing_page, payload.landing_page),
    referrer: first(payload.cf_referrer, payload.referrer),
  };
}
function hasUtm(utm) {
  return Boolean(utm.source || utm.medium || utm.campaign || utm.content || utm.term);
}
function classifySource(source) {
  const value = text(source).toLowerCase();
  if (!value || value === "(none)" || value === "(not set)" || value === "direct") return "desconhecido";
  if (/(utm_medium=(cpc|ppc|paid|paid_social)|gclid=|fbclid=|msclkid=|utm_source=(google|facebook|instagram|linkedin|tiktok|bing).*utm_medium=)/.test(value)) return "midia_paga";
  if (/(referral|partner|afiliad|display|banner|native|programmatic|outbrain|taboola)/.test(value)) return "outras_publicidades";
  if (/(utm_|organic|social|email|whatsapp|linkedin|instagram|facebook|youtube|google)/.test(value)) return "outros_canais";
  return "nao_permitida";
}
function isImportation(event) {
  const payload = payloadOf(event);
  const marker = [event.eventFamily, event.eventIdentifier, payload.conversion_identifier, payload.conversion_resource, payload.resource].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  return /(importa[cç][aã]o|importation|imported|csv_import|bulk_import)/.test(marker);
}
function phoneFromEvent(event) {
  const payload = event ? payloadOf(event) : {};
  return first(payload.mobile_phone, payload.personal_phone, payload.phone, payload.phone_number);
}
function eventTime(event) {
  return event?.eventCreatedAt ? new Date(event.eventCreatedAt).getTime() : 0;
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não está disponível.");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [contacts] = await db.query(`SELECT id, accountKey, contactUuid, name, email, phone, createdAtRd, lastConversionAt FROM rdStationContacts WHERE createdAtRd IS NULL OR createdAtRd < ?`, [CUTOFF_UTC]);
  const [events] = await db.query(`SELECT accountKey, contactUuid, eventUuid, eventType, eventFamily, eventIdentifier, eventCreatedAt, rawPayload FROM rdStationConversionEvents WHERE eventCreatedAt < ? ORDER BY eventCreatedAt ASC`, [CUTOFF_UTC]);
  const byContact = new Map();
  for (const event of events) {
    const key = `${event.accountKey}:${event.contactUuid}`;
    const list = byContact.get(key) ?? [];
    list.push(event);
    byContact.set(key, list);
  }
  const rows = contacts.map(contact => {
    const key = `${contact.accountKey}:${contact.contactUuid}`;
    const contactEvents = byContact.get(key) ?? [];
    const latestEvent = contactEvents.at(-1);
    const eventsWithUtm = contactEvents.filter(event => hasUtm(utmData(event)));
    const latestUtmEvent = eventsWithUtm.at(-1);
    const utm = utmData(latestUtmEvent ?? latestEvent);
    const latestPayload = latestEvent ? payloadOf(latestEvent) : {};
    const sourceString = utm.decodedSource || [utm.source && `utm_source=${utm.source}`, utm.medium && `utm_medium=${utm.medium}`, utm.campaign && `utm_campaign=${utm.campaign}`, utm.content && `utm_content=${utm.content}`, utm.term && `utm_term=${utm.term}`].filter(Boolean).join("&");
    const sourceBucket = classifySource(sourceString);
    const importation = latestUtmEvent ? isImportation(latestUtmEvent) : latestEvent ? isImportation(latestEvent) : false;
    return {
      marca: contact.accountKey === "medsystems" ? "Medsystems" : "BeautySystems",
      conta_rd: contact.accountKey,
      contact_uuid: contact.contactUuid,
      nome: first(contact.name, latestPayload.name),
      email: first(contact.email, latestPayload.email),
      telefone: first(contact.phone, phoneFromEvent(latestEvent)),
      data_criacao_rd: contact.createdAtRd ? new Date(contact.createdAtRd).toISOString() : "",
      data_ultima_conversao_rd: contact.lastConversionAt && new Date(contact.lastConversionAt).getTime() < Date.parse(`${CUTOFF_UTC}Z`) ? new Date(contact.lastConversionAt).toISOString() : (latestEvent ? new Date(latestEvent.eventCreatedAt).toISOString() : ""),
      evento_ultima_conversao: text(latestEvent?.eventIdentifier),
      familia_ultima_conversao: text(latestEvent?.eventFamily),
      uuid_ultimo_evento: text(latestEvent?.eventUuid),
      data_evento_com_utm: latestUtmEvent ? new Date(latestUtmEvent.eventCreatedAt).toISOString() : "",
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
      utm_term: utm.term,
      landing_page: utm.landingPage,
      referrer: utm.referrer,
      origem_decodificada: utm.decodedSource,
      classificacao_origem: sourceBucket,
      possui_utm_comprovada: hasUtm(utm) ? "Sim" : "Não",
      lead_midia_paga: sourceBucket === "midia_paga" && !importation ? "Sim" : "Não",
      evento_importacao_identificado: importation ? "Sim" : "Não",
      quantidade_eventos_ate_ontem: contactEvents.length,
      criterio_temporal: contact.createdAtRd ? "Data de criação RD até 24/08/2026" : "Sem data de criação RD; mantido para auditoria, não classificável por data",
      metodo_evidencia: latestEvent ? "Contato RD + evento de conversão armazenado" : "Contato RD armazenado; sem evento de conversão armazenado",
    };
  });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), cutoffLocal: "2026-08-24 23:59:59 BRT", contacts: rows }, null, 2));
  const summary = {};
  for (const row of rows) {
    summary[row.conta_rd] ??= { contatos: 0, comUtm: 0, midiaPaga: 0, comEvento: 0, semDataCriacao: 0 };
    summary[row.conta_rd].contatos += 1;
    summary[row.conta_rd].comUtm += row.possui_utm_comprovada === "Sim" ? 1 : 0;
    summary[row.conta_rd].midiaPaga += row.lead_midia_paga === "Sim" ? 1 : 0;
    summary[row.conta_rd].comEvento += row.quantidade_eventos_ate_ontem > 0 ? 1 : 0;
    summary[row.conta_rd].semDataCriacao += row.data_criacao_rd ? 0 : 1;
  }
  console.log(JSON.stringify({ cutoff: "2026-08-24 23:59:59 BRT", total: rows.length, summary, output: OUTPUT_JSON }, null, 2));
} finally {
  await db.end();
}
