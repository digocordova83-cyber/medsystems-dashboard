import { createHmac } from "node:crypto";
import { normalizeIdentityEmail, normalizeIdentityPhone, rdEventUtmValues } from "../db";
import { isImportationEvent } from "../rdstation/filtering";

export type PaidMediaAccountKey = "medsystems" | "beautysystems";
export type PaidMediaEventRow = {
  accountKey: PaidMediaAccountKey;
  contactUuid: string;
  rawPayload: string;
};
export type PaidMediaContactRow = {
  accountKey: PaidMediaAccountKey;
  contactUuid: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};
export type PaidMediaReferenceIdentity = {
  accountKey: PaidMediaAccountKey;
  identityHash: string;
  emailHash: string | null;
  phoneHash: string | null;
  namePhoneHash: string | null;
  rdContactUuid: string;
  evidence: "paid_utm" | "paid_page_or_form";
};

function parseEvent(rawPayload: string) {
  try { return JSON.parse(rawPayload) as Record<string, any>; } catch { return {}; }
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text && !/^(null|undefined|unknown|not set|\(not set\)|\(none\))$/i.test(text) ? text : null;
}

export function normalizeIdentityName(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function digest(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function paidUtmEvidence(rawPayload: string) {
  const utm = rdEventUtmValues(rawPayload);
  const source = clean(utm.utmSource)?.toLocaleLowerCase("pt-BR") ?? "";
  const medium = clean(utm.utmMedium)?.toLocaleLowerCase("pt-BR").replace(/[\s-]+/g, "_") ?? "";
  const campaign = clean(utm.utmCampaign);
  const paidMedium = /^(cpc|ppc|paid|paid_social|social_paid|display|programmatic|native|banner|retargeting)$/.test(medium);
  const recognizedPlatform = /^(google|google_ads|facebook|facebook_ads|instagram|meta|meta_ads|linkedin|tiktok|bing|dv360)$/.test(source);
  return Boolean(clean(utm.mediaCampaignId) || paidMedium || (recognizedPlatform && campaign));
}

export function paidMediaEvidenceKeys(rawPayload: string) {
  const event = parseEvent(rawPayload);
  const payload = event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : {};
  const keys = new Set<string>();
  for (const candidate of [payload.conversion_identifier, payload.conversion_resource, payload.resource, event.event_identifier]) {
    const value = clean(candidate)?.toLocaleLowerCase("pt-BR");
    if (value) keys.add(`conversion:${value}`);
  }
  const landing = clean(payload.cf_landing_page ?? payload.landing_page ?? payload.landing_page_url);
  if (landing) {
    try {
      const url = new URL(landing);
      keys.add(`page:${url.hostname.toLowerCase()}${url.pathname.replace(/\/$/, "").toLowerCase()}`);
    } catch {
      keys.add(`page:${landing.split("?")[0]!.replace(/\/$/, "").toLowerCase()}`);
    }
  }
  return keys;
}

export function buildPaidMediaReferenceIdentities(input: {
  events: PaidMediaEventRow[];
  contacts: PaidMediaContactRow[];
  identitySecret: string;
}) {
  const usableEvents = input.events.filter(event => !isImportationEvent(parseEvent(event.rawPayload)));
  const paidKeysByAccount = new Map<PaidMediaAccountKey, Set<string>>();
  for (const event of usableEvents) {
    if (!paidUtmEvidence(event.rawPayload)) continue;
    const keys = paidKeysByAccount.get(event.accountKey) ?? new Set<string>();
    for (const key of Array.from(paidMediaEvidenceKeys(event.rawPayload))) keys.add(key);
    paidKeysByAccount.set(event.accountKey, keys);
  }

  const evidenceByContact = new Map<string, "paid_utm" | "paid_page_or_form">();
  for (const event of usableEvents) {
    const contactKey = `${event.accountKey}:${event.contactUuid}`;
    if (paidUtmEvidence(event.rawPayload)) {
      evidenceByContact.set(contactKey, "paid_utm");
      continue;
    }
    const accountKeys = paidKeysByAccount.get(event.accountKey) ?? new Set<string>();
    if (Array.from(paidMediaEvidenceKeys(event.rawPayload)).some(key => accountKeys.has(key))) {
      evidenceByContact.set(contactKey, "paid_page_or_form");
    }
  }

  const references: PaidMediaReferenceIdentity[] = [];
  for (const contact of input.contacts) {
    const evidence = evidenceByContact.get(`${contact.accountKey}:${contact.contactUuid}`);
    if (!evidence) continue;
    const email = normalizeIdentityEmail(contact.email);
    const phone = normalizeIdentityPhone(contact.phone);
    const name = normalizeIdentityName(contact.name);
    const identitySeed = email ? `email:${email}` : phone ? `phone:${phone}` : `uuid:${contact.contactUuid}`;
    references.push({
      accountKey: contact.accountKey,
      identityHash: digest(input.identitySecret, `${contact.accountKey}|${identitySeed}`),
      emailHash: email ? digest(input.identitySecret, email) : null,
      phoneHash: phone ? digest(input.identitySecret, phone) : null,
      namePhoneHash: name && phone ? digest(input.identitySecret, `${name}|${phone}`) : null,
      rdContactUuid: contact.contactUuid,
      evidence,
    });
  }
  return references;
}
