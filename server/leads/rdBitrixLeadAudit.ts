import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { bitrix24Entities, rdStationContacts, rdStationConversionEvents } from "../../drizzle/schema";
import { bitrixLeadPipelineBrand, getDb, normalizeIdentityEmail, normalizeIdentityPhone, saoPauloBusinessDate } from "../db";
import { bitrixLeadStageLabel, RD_STATION_FIELD, RD_STATION_VALUE, validateBusinessDateRange } from "../bitrix24/rdOpportunityAnalytics";
import { normalizeIdentityName } from "./paidMediaEvidence";
import { qualifiesDirectApiEvent, type SourceBucket } from "../rdstation/filtering";

type AuditBrand = "all" | "medsystems" | "beautysystems";
type AuditMatchStatus = "all" | "lead" | "contact_only" | "not_found" | "multiple";
type AccountKey = Exclude<AuditBrand, "all">;

export type RdBitrixLeadAuditFilters = {
  startDate: string;
  endDate: string;
  brand: AuditBrand;
  matchStatus: AuditMatchStatus;
};

type RdContact = {
  accountKey: AccountKey;
  contactUuid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type RdEvent = {
  accountKey: AccountKey;
  contactUuid: string;
  eventCreatedAt: Date;
  eventIdentifier: string | null;
  rawPayload: string;
};

type BitrixEntity = {
  entityType: "lead" | "contact";
  bitrixId: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  stageOrStatus: string | null;
  createdAtBitrix: Date;
  rawPayload: string;
};

export type BitrixAuditCandidate = {
  entityType: "lead" | "contact";
  bitrixId: number;
  name: string;
  email: string;
  phone: string;
  stage: string;
  createdAt: string;
};

const BRAND_LABEL: Record<AccountKey, string> = {
  medsystems: "MedSystems",
  beautysystems: "BeautySystems",
};

const SOURCE_LABEL: Record<SourceBucket, string> = {
  midia_paga: "Mídia paga",
  desconhecido: "Origem desconhecida",
  outros_canais: "Outros canais",
  outras_publicidades: "Outras publicidades",
  nao_permitida: "Origem não permitida",
};

function parsePayload(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function addIndex(index: Map<string, BitrixEntity[]>, value: string | null, entity: BitrixEntity) {
  if (!value) return;
  const current = index.get(value) ?? [];
  if (!current.some(item => item.entityType === entity.entityType && item.bitrixId === entity.bitrixId)) current.push(entity);
  index.set(value, current);
}

function uniqueEntities(values: BitrixEntity[]) {
  return Array.from(new Map(values.map(value => [`${value.entityType}:${value.bitrixId}`, value])).values())
    .sort((a, b) => a.entityType.localeCompare(b.entityType) || a.bitrixId - b.bitrixId);
}

function matchMethod(emailMatched: boolean, nameMatched: boolean) {
  if (emailMatched && nameMatched) return "E-mail + nome";
  if (emailMatched) return "E-mail";
  if (nameMatched) return "Nome";
  return "Sem correspondência";
}

export function auditMatchStatus(input: { emailMatched: boolean; nameMatched: boolean; leadCount: number; contactCount: number; totalCount: number }) {
  const status: Exclude<AuditMatchStatus, "all"> = input.totalCount > 1 ? "multiple" : input.leadCount ? "lead" : input.contactCount ? "contact_only" : "not_found";
  return { status, method: matchMethod(input.emailMatched, input.nameMatched) };
}

export function bitrixAuditCandidate(entity: BitrixEntity): BitrixAuditCandidate {
  const raw = parsePayload(entity.rawPayload);
  return {
    entityType: entity.entityType,
    bitrixId: entity.bitrixId,
    name: entity.fullName?.trim() || "Não informado",
    email: entity.email?.trim() || "Não informado",
    phone: entity.phone?.trim() || "Não informado",
    stage: entity.entityType === "lead" ? bitrixLeadStageLabel(raw.STATUS_ID ?? entity.stageOrStatus) : "Contato sem etapa de Lead",
    createdAt: saoPauloBusinessDate(entity.createdAtBitrix),
  };
}

function emptyBrandTotals() {
  return { rdQualifiedEvents: 0, rdQualifiedContacts: 0, bitrixTechnicalLeads: 0, bitrixRdStationLeads: 0, matchedAsLead: 0, matchedAsContactOnly: 0, notFound: 0, multiple: 0 };
}

export async function rdBitrixLeadAudit(input: RdBitrixLeadAuditFilters & { portal: string }) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const range = validateBusinessDateRange(input.startDate, input.endDate);
  const brands = input.brand === "all" ? ["medsystems", "beautysystems"] as const : [input.brand] as const;
  const [events, contacts, bitrixLeads, bitrixContacts] = await Promise.all([
    db.select({ accountKey: rdStationConversionEvents.accountKey, contactUuid: rdStationConversionEvents.contactUuid, eventCreatedAt: rdStationConversionEvents.eventCreatedAt, eventIdentifier: rdStationConversionEvents.eventIdentifier, rawPayload: rdStationConversionEvents.rawPayload })
      .from(rdStationConversionEvents)
      .where(and(inArray(rdStationConversionEvents.accountKey, brands), gte(rdStationConversionEvents.eventCreatedAt, range.start), lt(rdStationConversionEvents.eventCreatedAt, range.endExclusive))),
    db.select({ accountKey: rdStationContacts.accountKey, contactUuid: rdStationContacts.contactUuid, name: rdStationContacts.name, email: rdStationContacts.email, phone: rdStationContacts.phone })
      .from(rdStationContacts)
      .where(inArray(rdStationContacts.accountKey, brands)),
    db.select({ entityType: bitrix24Entities.entityType, bitrixId: bitrix24Entities.bitrixId, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, stageOrStatus: bitrix24Entities.stageOrStatus, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "lead"))),
    db.select({ entityType: bitrix24Entities.entityType, bitrixId: bitrix24Entities.bitrixId, fullName: bitrix24Entities.fullName, email: bitrix24Entities.email, phone: bitrix24Entities.phone, stageOrStatus: bitrix24Entities.stageOrStatus, createdAtBitrix: bitrix24Entities.createdAtBitrix, rawPayload: bitrix24Entities.rawPayload })
      .from(bitrix24Entities)
      .where(and(eq(bitrix24Entities.portal, input.portal), eq(bitrix24Entities.entityType, "contact"))),
  ]);

  const contactByKey = new Map<string, RdContact>();
  for (const contact of contacts) contactByKey.set(`${contact.accountKey}:${contact.contactUuid}`, contact as RdContact);

  const qualified = new Map<string, { contact: RdContact; firstEvent: RdEvent; sourceBucket: SourceBucket; eventCount: number }>();
  const brandTotals: Record<AccountKey, ReturnType<typeof emptyBrandTotals>> = { medsystems: emptyBrandTotals(), beautysystems: emptyBrandTotals() };
  const unassignedBitrix = { technicalLeads: 0, rdStationLeads: 0 };
  for (const event of events as RdEvent[]) {
    const verdict = qualifiesDirectApiEvent(parsePayload(event.rawPayload));
    if (!verdict.qualifies) continue;
    const contact = contactByKey.get(`${event.accountKey}:${event.contactUuid}`) ?? { accountKey: event.accountKey, contactUuid: event.contactUuid, name: null, email: null, phone: null };
    const key = `${event.accountKey}:${event.contactUuid}`;
    const existing = qualified.get(key);
    if (existing) {
      existing.eventCount += 1;
      if (event.eventCreatedAt < existing.firstEvent.eventCreatedAt) {
        existing.firstEvent = event;
        existing.sourceBucket = verdict.sourceBucket;
      }
    } else {
      qualified.set(key, { contact, firstEvent: event, sourceBucket: verdict.sourceBucket, eventCount: 1 });
    }
    brandTotals[event.accountKey].rdQualifiedEvents += 1;
  }

  const contactById = new Map(bitrixContacts.map(row => [row.bitrixId, row as BitrixEntity]));
  const linkedContactIds = new Set<number>();
  const allBitrix = bitrixLeads.map(row => {
    const entity = row as BitrixEntity;
    const raw = parsePayload(entity.rawPayload);
    const relatedContact = contactById.get(Number(raw.CONTACT_ID));
    if (relatedContact) linkedContactIds.add(relatedContact.bitrixId);
    return {
      ...entity,
      email: normalizeIdentityEmail(entity.email) ? entity.email : relatedContact?.email ?? null,
      phone: normalizeIdentityPhone(entity.phone) ? entity.phone : relatedContact?.phone ?? null,
      fullName: normalizeIdentityName(entity.fullName) ? entity.fullName : relatedContact?.fullName ?? null,
    };
  }).concat(bitrixContacts.filter(row => !linkedContactIds.has(row.bitrixId)).map(row => row as BitrixEntity));
  const byEmail = new Map<string, BitrixEntity[]>();
  const byName = new Map<string, BitrixEntity[]>();
  for (const entity of allBitrix) {
    addIndex(byEmail, normalizeIdentityEmail(entity.email), entity);
    addIndex(byName, normalizeIdentityName(entity.fullName), entity);
  }

  for (const lead of bitrixLeads as BitrixEntity[]) {
    if (lead.createdAtBitrix < range.start || lead.createdAtBitrix >= range.endExclusive) continue;
    const raw = parsePayload(lead.rawPayload);
    const brand = bitrixLeadPipelineBrand(raw);
    const hasRdStationFlag = String(raw[RD_STATION_FIELD] ?? "") === RD_STATION_VALUE;
    if (!brand) {
      if (input.brand === "all") {
        unassignedBitrix.technicalLeads += 1;
        if (hasRdStationFlag) unassignedBitrix.rdStationLeads += 1;
      }
      continue;
    }
    if (!brands.includes(brand)) continue;
    brandTotals[brand].bitrixTechnicalLeads += 1;
    if (hasRdStationFlag) brandTotals[brand].bitrixRdStationLeads += 1;
  }

  const rows = Array.from(qualified.values()).map(item => {
    const { contact } = item;
    const email = normalizeIdentityEmail(contact.email);
    const name = normalizeIdentityName(contact.name);
    const emailMatches = email ? byEmail.get(email) ?? [] : [];
    const nameMatches = emailMatches.length ? [] : name ? byName.get(name) ?? [] : [];
    const allMatches = uniqueEntities(emailMatches.length ? emailMatches : nameMatches);
    const leadMatches = allMatches.filter(match => match.entityType === "lead");
    const contactMatches = allMatches.filter(match => match.entityType === "contact");
    const linkedContactIds = new Set(leadMatches.map(match => Number(parsePayload(match.rawPayload).CONTACT_ID)).filter(id => Number.isInteger(id) && id > 0));
    const independentContactMatches = contactMatches.filter(match => !linkedContactIds.has(match.bitrixId));
    const matchedLead = leadMatches[0] ?? null;
    const matchedContact = independentContactMatches[0] ?? contactMatches[0] ?? null;
    const match = auditMatchStatus({
      emailMatched: emailMatches.length > 0,
      nameMatched: nameMatches.length > 0,
      leadCount: leadMatches.length,
      contactCount: independentContactMatches.length || (leadMatches.length ? 0 : contactMatches.length),
      totalCount: leadMatches.length + independentContactMatches.length || contactMatches.length,
    });
    const status = match.status;
    const representative = matchedLead ?? matchedContact;
    const totals = brandTotals[contact.accountKey];
    totals.rdQualifiedContacts += 1;
    if (status === "lead") totals.matchedAsLead += 1;
    else if (status === "contact_only") totals.matchedAsContactOnly += 1;
    else if (status === "multiple") totals.multiple += 1;
    else totals.notFound += 1;
    const raw = representative ? parsePayload(representative.rawPayload) : {};
    return {
      key: `${contact.accountKey}:${contact.contactUuid}`,
      brand: contact.accountKey,
      brandLabel: BRAND_LABEL[contact.accountKey],
      name: contact.name?.trim() || "Não informado",
      email: contact.email?.trim() || "Não informado",
      phone: contact.phone?.trim() || "Não informado",
      rdDate: saoPauloBusinessDate(item.firstEvent.eventCreatedAt),
      rdEvent: item.firstEvent.eventIdentifier || "Conversão RD Station",
      rdSource: SOURCE_LABEL[item.sourceBucket],
      rdEventCount: item.eventCount,
      matchStatus: status,
      matchMethod: match.method,
      bitrixEntity: representative?.entityType === "lead" ? "Lead" : representative?.entityType === "contact" ? "Contato" : "Não encontrado",
      bitrixStage: representative?.entityType === "lead" ? bitrixLeadStageLabel(raw.STATUS_ID ?? representative.stageOrStatus) : representative ? "Contato sem etapa de Lead" : "Sem registro no Bitrix24",
      bitrixId: representative?.bitrixId ?? null,
      bitrixRecordCount: allMatches.length,
      bitrixCreatedAt: representative ? saoPauloBusinessDate(representative.createdAtBitrix) : null,
      bitrixCandidates: status === "multiple" ? allMatches.map(bitrixAuditCandidate) : [],
    };
  }).filter(row => input.matchStatus === "all" || row.matchStatus === input.matchStatus)
    .sort((a, b) => a.rdDate.localeCompare(b.rdDate) || a.brandLabel.localeCompare(b.brandLabel) || a.name.localeCompare(b.name, "pt-BR"));

  const visibleBrands = brands.map(brand => ({ brand, label: BRAND_LABEL[brand], ...brandTotals[brand] }));
  const totals = visibleBrands.reduce((sum, row) => ({
    rdQualifiedEvents: sum.rdQualifiedEvents + row.rdQualifiedEvents,
    rdQualifiedContacts: sum.rdQualifiedContacts + row.rdQualifiedContacts,
    bitrixTechnicalLeads: sum.bitrixTechnicalLeads + row.bitrixTechnicalLeads,
    bitrixRdStationLeads: sum.bitrixRdStationLeads + row.bitrixRdStationLeads,
    matchedAsLead: sum.matchedAsLead + row.matchedAsLead,
    matchedAsContactOnly: sum.matchedAsContactOnly + row.matchedAsContactOnly,
    notFound: sum.notFound + row.notFound,
    multiple: sum.multiple + row.multiple,
  }), emptyBrandTotals());
  if (input.brand === "all") {
    totals.bitrixTechnicalLeads += unassignedBitrix.technicalLeads;
    totals.bitrixRdStationLeads += unassignedBitrix.rdStationLeads;
  }

  return {
    filters: { startDate: input.startDate, endDate: input.endDate, brand: input.brand, matchStatus: input.matchStatus },
    totals,
    byBrand: visibleBrands,
    unassignedBitrix,
    rows,
    methodology: {
      rd: "Contatos únicos com pelo menos uma conversão RD Station no período que atende às fontes permitidas e não é importação.",
      bitrix: "Leads técnicos do Bitrix24 criados no período; a coluna RD Station = sim é apresentada separadamente e não substitui o universo do RD.",
      matching: "A auditoria prioriza e-mail exato. Quando não há e-mail correspondente, usa nome normalizado; múltiplos registros permanecem explícitos. A busca retorna Lead ou, na ausência dele, Contato sem etapa de Lead.",
      privacy: "Dados pessoais são retornados exclusivamente para sessão autenticada do Dashboard.",
    },
  };
}
