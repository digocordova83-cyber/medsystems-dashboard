import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import { rdEventUtmValues } from "../server/db.ts";
import { programmaticDashboard } from "../server/publya/dashboard.ts";

const PORTAL = "medsystems.bitrix24.com.br";
const START_DATE = "2026-08-01";
const END_DATE = "2026-09-22";
const START_UTC = "2026-08-01 03:00:00";
const END_UTC_EXCLUSIVE = "2026-09-23 03:00:00";
const RD_STATION_FIELD = "UF_CRM_1738950899";
const RD_STATION_VALUE = "1";
const PIPELINE_FIELD = "UF_CRM_1739195085";
const COMMERCIAL_PIPELINES = new Set(["15391", "15395"]);
const PIPELINE_LABELS = {
  "15391": "MedSystems",
  "15395": "BeautySystems",
  "20889": "Não atribuído · pipeline 20889",
  "18811": "Franquias",
};
const LEAD_STATUS_LABELS = {
  NEW: "SDR",
  IN_PROCESS: "Primeiro Contato",
  PROCESSED: "Segundo Contato",
  UC_CU60JH: "Terceiro Contato",
  UC_HZQN9I: "Relacionamento",
  "1": "Converter Lead",
  CONVERTED: "Histórico Lead Convertidos",
  JUNK: "Lead Descartado",
  UC_8AJSSF: "Lead Descartado p/ MKT",
};

function parsePayload(value) {
  try { return JSON.parse(value); } catch { return {}; }
}
function text(value) { return String(value ?? "").trim(); }
function normalized(value) { return text(value).toLowerCase(); }
function stableRef(prefix, value) { return `${prefix}-${createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, 16)}`; }
function normalizeEmail(value) { const v = normalized(value); return v && v.includes("@") ? v : null; }
function normalizeName(value) {
  const v = normalized(value).normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  return v || null;
}
function dateBrt(value) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
function classifyProgrammatic(event) {
  const utm = rdEventUtmValues(event.rawPayload);
  const campaign = normalized(utm.utmCampaign);
  const identifier = normalized(event.eventIdentifier);
  const all = [identifier, utm.utmSource, utm.utmMedium, utm.utmCampaign, utm.utmContent, utm.utmTerm, utm.mediaCampaignId].map(normalized).join(" | ");
  const directText = `${campaign} ${identifier}`;
  const direct = directText.includes("ago a set/26") && directText.includes("b2b") && directText.includes("fb ig") && directText.includes("cadastro");
  const expanded = /(publya|programat|programmatic|dv360|geolocal)/i.test(all);
  const imported = /(import|csv)/i.test(`${identifier} ${event.rawPayload}`);
  return { qualifies: (direct || expanded) && !imported, direct, expanded, imported, utm };
}
function addIndex(map, key, value) {
  if (!key || key === "0") return;
  const list = map.get(key) ?? [];
  if (!list.some(item => item.bitrixId === value.bitrixId)) list.push(value);
  map.set(key, list);
}
function uniqueById(rows) { return [...new Map(rows.map(row => [String(row.bitrixId), row])).values()]; }
function dealStatus(payload) {
  const semantic = text(payload.STAGE_SEMANTIC_ID).toUpperCase();
  if (semantic === "S") return "ganho";
  if (semantic === "F") return "perdido";
  return "aberto";
}
function buFromPipeline(value) {
  const pipeline = text(value);
  return PIPELINE_LABELS[pipeline] ?? (pipeline ? `Pipeline #${pipeline}` : "Sem pipeline");
}
function leadStage(payload) {
  const id = text(payload.STATUS_ID) || "(sem status)";
  return { id, label: LEAD_STATUS_LABELS[id] ?? `Etapa #${id}` };
}
function programmaticOnlySummary(snapshot) {
  const rows = snapshot.campaigns.filter(row => row.reportType === "Programática Display" && row.counted);
  const display = rows.reduce((sum, row) => ({
    spend: sum.spend + Number(row.spend ?? 0),
    impressions: sum.impressions + Number(row.impressions ?? 0),
    reach: sum.reach + Number(row.reach ?? 0),
    clicks: sum.clicks + Number(row.clicks ?? 0),
    conversions: sum.conversions + Number(row.conversions ?? 0),
    leads: sum.leads + Number(row.leads ?? 0),
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, conversions: 0, leads: 0 });
  const push = snapshot.push ? {
    spend: Number(snapshot.push.spend ?? 0),
    sends: Number(snapshot.push.sends ?? 0),
    clicks: Number(snapshot.push.clicks ?? 0),
    ctr: Number(snapshot.push.ctr ?? 0),
    cpd: Number(snapshot.push.cpd ?? 0),
  } : { spend: 0, sends: 0, clicks: 0, ctr: 0, cpd: 0 };
  return {
    display,
    push,
    combinedSpend: display.spend + push.spend,
    displayCtr: display.impressions > 0 ? (display.clicks / display.impressions) * 100 : 0,
    displayCpm: display.impressions > 0 ? (display.spend / display.impressions) * 1000 : 0,
    displayCpc: display.clicks > 0 ? display.spend / display.clicks : 0,
  };
}
function compactDeal(deal) {
  const payload = deal.payload;
  return {
    dealRef: `deal-${deal.bitrixId}`,
    status: dealStatus(payload),
    pipeline: buFromPipeline(payload[PIPELINE_FIELD] ?? payload.CATEGORY_ID),
    categoryId: text(payload.CATEGORY_ID) || null,
    createdAtBrt: dateBrt(deal.createdAtBitrix),
    opportunity: Number(payload.OPPORTUNITY ?? 0) || 0,
    leadId: text(payload.LEAD_ID) || null,
    contactId: text(payload.CONTACT_ID) || null,
  };
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [eventRows] = await connection.query(`
    SELECT accountKey, contactUuid, eventUuid, eventIdentifier, eventCreatedAt, rawPayload
    FROM rdStationConversionEvents
    WHERE eventCreatedAt >= ? AND eventCreatedAt < ?
    ORDER BY eventCreatedAt ASC
  `, [START_UTC, END_UTC_EXCLUSIVE]);
  const [contactRows] = await connection.query(`
    SELECT accountKey, contactUuid, name, email, phone
    FROM rdStationContacts
    WHERE accountKey IN ('medsystems', 'beautysystems')
  `);
  const [leadRows] = await connection.query(`
    SELECT bitrixId, fullName, email, phone, createdAtBitrix, rawPayload
    FROM bitrix24Entities
    WHERE portal = ? AND entityType = 'lead'
  `, [PORTAL]);
  const [contactBitrixRows] = await connection.query(`
    SELECT bitrixId, fullName, email, phone, rawPayload
    FROM bitrix24Entities
    WHERE portal = ? AND entityType = 'contact'
  `, [PORTAL]);
  const [dealRows] = await connection.query(`
    SELECT bitrixId, createdAtBitrix, rawPayload
    FROM bitrix24Entities
    WHERE portal = ? AND entityType = 'deal'
  `, [PORTAL]);

  const contactByKey = new Map(contactRows.map(row => [`${row.accountKey}:${row.contactUuid}`, row]));
  const matches = [];
  const eventMatches = [];
  for (const event of eventRows) {
    const verdict = classifyProgrammatic(event);
    if (!verdict.qualifies) continue;
    const contact = contactByKey.get(`${event.accountKey}:${event.contactUuid}`) ?? { accountKey: event.accountKey, contactUuid: event.contactUuid, name: null, email: null, phone: null };
    const contactKey = `${event.accountKey}:${event.contactUuid}`;
    const existing = matches.find(row => row.contactKey === contactKey);
    const eventItem = {
      eventRef: stableRef("event", event.eventUuid),
      dateBrt: dateBrt(event.eventCreatedAt),
      direct: verdict.direct,
      match: verdict.direct && verdict.expanded ? "campaign_exact,utm_keyword" : verdict.direct ? "campaign_exact" : "utm_keyword",
      source: verdict.utm.utmSource,
      medium: verdict.utm.utmMedium,
      campaign: verdict.utm.utmCampaign,
      content: verdict.utm.utmContent,
      term: verdict.utm.utmTerm,
      mediaCampaignId: verdict.utm.mediaCampaignId,
    };
    eventMatches.push({ contactKey, accountKey: event.accountKey, ...eventItem });
    if (existing) {
      existing.events.push(eventItem);
    } else {
      matches.push({
        contactKey,
        accountKey: event.accountKey,
        contactUuid: event.contactUuid,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        events: [eventItem],
      });
    }
  }

  const bitrixLeads = leadRows.map(row => {
    const payload = parsePayload(row.rawPayload);
    return {
      bitrixId: Number(row.bitrixId),
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      createdAtBitrix: row.createdAtBitrix,
      payload,
      rdStation: text(payload[RD_STATION_FIELD]) === RD_STATION_VALUE,
      pipeline: text(payload[PIPELINE_FIELD]),
      contactId: text(payload.CONTACT_ID),
      stage: leadStage(payload),
    };
  }).filter(row => row.rdStation);
  const bitrixContacts = contactBitrixRows.map(row => ({ ...row, payload: parsePayload(row.rawPayload) }));
  const contactEmailById = new Map(bitrixContacts.map(row => [String(row.bitrixId), normalizeEmail(row.email)]));
  const leadByEmail = new Map();
  const leadByName = new Map();
  for (const lead of bitrixLeads) {
    const email = normalizeEmail(lead.email) ?? contactEmailById.get(lead.contactId);
    const name = normalizeName(lead.fullName);
    addIndex(leadByEmail, email, lead);
    addIndex(leadByName, name, lead);
  }

  const deals = dealRows.map(row => ({ bitrixId: Number(row.bitrixId), createdAtBitrix: row.createdAtBitrix, payload: parsePayload(row.rawPayload) }));
  const dealsByLeadId = new Map();
  const dealsByContactId = new Map();
  for (const deal of deals) {
    addIndex(dealsByLeadId, text(deal.payload.LEAD_ID), deal);
    addIndex(dealsByContactId, text(deal.payload.CONTACT_ID), deal);
  }

  for (const match of matches) {
    const email = normalizeEmail(match.email);
    const name = normalizeName(match.name);
    const emailMatches = email ? leadByEmail.get(email) ?? [] : [];
    const nameMatches = emailMatches.length ? [] : name ? leadByName.get(name) ?? [] : [];
    const candidates = uniqueById(emailMatches.length ? emailMatches : nameMatches);
    const method = emailMatches.length ? "e-mail" : nameMatches.length ? "nome" : "sem correspondência";
    const candidateDeals = uniqueById(candidates.flatMap(lead => [
      ...(dealsByLeadId.get(String(lead.bitrixId)) ?? []),
      ...(dealsByContactId.get(lead.contactId) ?? []),
    ]));
    match.matchMethod = method;
    match.leads = candidates;
    match.deals = candidateDeals;
    match.matchStatus = candidates.length === 0 ? "não encontrado" : candidates.length === 1 ? "1 Lead" : `${candidates.length} Leads técnicos`;
  }

  const dealsAll = uniqueById(matches.flatMap(match => match.deals ?? []));
  const wonDeals = dealsAll.filter(deal => dealStatus(deal.payload) === "ganho");
  const openDeals = dealsAll.filter(deal => dealStatus(deal.payload) === "aberto");
  const lostDeals = dealsAll.filter(deal => dealStatus(deal.payload) === "perdido");
  const matchedContacts = matches.filter(row => row.leads?.length);
  const directContacts = matches.filter(row => row.events.some(event => event.direct));
  const byBrand = Object.fromEntries(["medsystems", "beautysystems"].map(accountKey => {
    const rows = matches.filter(row => row.accountKey === accountKey);
    const rowDeals = uniqueById(rows.flatMap(row => row.deals ?? []));
    return [accountKey, {
      rdContacts: rows.length,
      matchedContacts: rows.filter(row => row.leads?.length).length,
      matchedTechnicalLeads: rows.reduce((sum, row) => sum + (row.leads?.length ?? 0), 0),
      contactsWithDeals: rows.filter(row => row.deals?.length).length,
      wonDeals: uniqueById(rowDeals.filter(deal => dealStatus(deal.payload) === "ganho")).length,
      wonValue: rowDeals.filter(deal => dealStatus(deal.payload) === "ganho").reduce((sum, deal) => sum + (Number(deal.payload.OPPORTUNITY ?? 0) || 0), 0),
      openDeals: uniqueById(rowDeals.filter(deal => dealStatus(deal.payload) === "aberto")).length,
      lostDeals: uniqueById(rowDeals.filter(deal => dealStatus(deal.payload) === "perdido")).length,
    }];
  }));

  const leadStageCounts = new Map();
  for (const match of matches) for (const lead of match.leads ?? []) {
    const key = lead.stage.label;
    leadStageCounts.set(key, (leadStageCounts.get(key) ?? 0) + 1);
  }
  const [programmaticAugust, programmaticSeptember] = await Promise.all([
    programmaticDashboard({ startDate: "2026-08-01", endDate: "2026-08-31", reportKey: "all" }),
    programmaticDashboard({ startDate: "2026-09-01", endDate: "2026-09-22", reportKey: "all" }),
  ]);
  const programmatic = programmaticSeptember;
  const output = {
    generatedAt: new Date().toISOString(),
    period: { startDate: START_DATE, endDate: END_DATE, lastDataDate: dateBrt(eventRows.at(-1)?.eventCreatedAt ?? new Date()), timezone: "America/Sao_Paulo" },
    criteria: {
      directCampaign: "utm_campaign ou identificador contendo Ago a Set/26, B2B, FB IG e Cadastro",
      expandedUtm: "qualquer UTM contendo publya, programat, programmatic, dv360 ou geolocal",
      bitrixMatch: "e-mail exato; na ausência de e-mail, nome normalizado; somente Leads com UF_CRM_1738950899 = 1",
      wonDefinition: "Negócio Bitrix24 com STAGE_SEMANTIC_ID = S, em qualquer data de criação disponível até o corte",
    },
    rd: {
      uniqueContacts: matches.length,
      conversions: eventMatches.length,
      directContacts: directContacts.length,
      byBrand: { medsystems: matches.filter(row => row.accountKey === "medsystems").length, beautysystems: matches.filter(row => row.accountKey === "beautysystems").length },
      monthly: Object.fromEntries(["2026-08", "2026-09"].map(month => [month, { contacts: new Set(matches.filter(row => row.events.some(event => event.dateBrt.startsWith(month))).map(row => row.contactKey)).size, conversions: eventMatches.filter(event => event.dateBrt.startsWith(month)).length } ])),
    },
    bitrix: {
      rdContactsMatched: matchedContacts.length,
      rdContactsNotFound: matches.length - matchedContacts.length,
      technicalLeadsMatched: matches.reduce((sum, row) => sum + (row.leads?.length ?? 0), 0),
      contactsWithDeals: matches.filter(row => row.deals?.length).length,
      uniqueDeals: dealsAll.length,
      wonDeals: wonDeals.length,
      wonValue: wonDeals.reduce((sum, deal) => sum + (Number(deal.payload.OPPORTUNITY ?? 0) || 0), 0),
      openDeals: openDeals.length,
      lostDeals: lostDeals.length,
      byBrand,
      leadStageCounts: Object.fromEntries([...leadStageCounts.entries()].sort((a, b) => b[1] - a[1])),
      leadsInConvertedStatus: matches.reduce((sum, match) => sum + (match.leads ?? []).filter(lead => ["1", "CONVERTED"].includes(lead.stage.id)).length, 0),
      deals: dealsAll.map(compactDeal),
      leadMatchStatus: Object.fromEntries(["não encontrado", "1 Lead", "múltiplos"].map(status => [status, status === "não encontrado" ? matches.filter(row => row.matchStatus === status).length : status === "1 Lead" ? matches.filter(row => row.matchStatus === status).length : matches.filter(row => (row.leads?.length ?? 0) > 1).length])),
    },
    programmatic: {
      period: programmatic.period,
      totals: programmatic.totals,
      monthly: {
        "2026-08": { period: programmaticAugust.period, totals: programmaticAugust.totals, programmaticOnly: programmaticOnlySummary(programmaticAugust), quality: programmaticAugust.quality, push: programmaticAugust.push },
        "2026-09": { period: programmaticSeptember.period, totals: programmaticSeptember.totals, programmaticOnly: programmaticOnlySummary(programmaticSeptember), quality: programmaticSeptember.quality, push: programmaticSeptember.push },
      },
      quality: programmatic.quality,
      campaigns: programmatic.campaigns.map(row => ({ campaignId: row.campaignId, campaignName: row.campaignName, platform: row.platform, reportType: row.reportType, counted: row.counted, duplicateOf: row.duplicateOf, spend: row.spend, impressions: row.impressions, reach: row.reach, clicks: row.clicks, conversions: row.conversions, leads: row.leads, dataDate: row.dataDate })),
      push: programmatic.push,
    },
    rows: matches.map(row => ({
      contactRef: stableRef(row.accountKey, row.contactUuid),
      brand: row.accountKey,
      conversionCount: row.events.length,
      firstDateBrt: row.events[0]?.dateBrt ?? null,
      lastDateBrt: row.events.at(-1)?.dateBrt ?? null,
      events: row.events,
      matchMethod: row.matchMethod,
      matchStatus: row.matchStatus,
      technicalLeadCount: row.leads?.length ?? 0,
      leadStages: (row.leads ?? []).map(lead => ({ id: lead.stage.id, label: lead.stage.label })),
      dealCount: row.deals?.length ?? 0,
      wonDealCount: (row.deals ?? []).filter(deal => dealStatus(deal.payload) === "ganho").length,
      openDealCount: (row.deals ?? []).filter(deal => dealStatus(deal.payload) === "aberto").length,
      lostDealCount: (row.deals ?? []).filter(deal => dealStatus(deal.payload) === "perdido").length,
    })),
  };
  const outputPath = "/tmp/medsystems-programmatic-sales-2026-09-24.json";
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");
  console.log(JSON.stringify({ outputPath, summary: { rd: output.rd, bitrix: output.bitrix, programmatic: output.programmatic.totals } }, null, 2));
} finally {
  await connection.end();
}
