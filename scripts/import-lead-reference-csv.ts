import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { normalizeIdentityEmail, normalizeIdentityPhone } from "../server/db";
import { normalizeIdentityName } from "../server/leads/paidMediaEvidence";

type AccountKey = "medsystems" | "beautysystems";
type Channel = "meta_ads" | "google_ads" | "unknown";
type CsvRow = Record<string, string>;

const inputPath = process.argv[2];
if (!inputPath) throw new Error("Informe o caminho do CSV de referência.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL indisponível.");
if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET indisponível para hashing de identidade.");

function parseCsv(content: string): CsvRow[] {
  const grid: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]!;
    const next = content[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(value); value = ""; }
    else if (char === "\n") { row.push(value.replace(/\r$/, "")); grid.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, "")); grid.push(row); }
  const [header = [], ...body] = grid;
  return body
    .filter(values => values.some(cell => cell.trim()))
    .map(values => Object.fromEntries(header.map((key, index) => [key.trim(), (values[index] ?? "").trim()])));
}

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return !text || /^(null|unknown|undefined|not set|\(not set\)|\(none\))$/i.test(text) ? null : text;
}

function normalizeLabel(value: unknown) {
  return clean(value)?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR") ?? null;
}

function accountKey(value: unknown): AccountKey | null {
  const label = normalizeLabel(value) ?? "";
  if (label === "medsystems") return "medsystems";
  if (label === "negocioserredes" || label === "beautysystems") return "beautysystems";
  return null;
}

function channel(value: unknown): Channel {
  const label = normalizeLabel(value) ?? "";
  if (label === "facebook" || label === "facebook ads" || label === "meta") return "meta_ads";
  if (label === "google" || label === "google ads") return "google_ads";
  return "unknown";
}

function digest(value: string) {
  return createHmac("sha256", process.env.JWT_SECRET!).update(value).digest("hex");
}

const rows = parseCsv(await readFile(inputPath, "utf8"));
const db = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [contactRows] = await db.query<mysql.RowDataPacket[]>("SELECT accountKey, contactUuid, email, phone FROM rdStationContacts WHERE accountKey IN ('medsystems','beautysystems')");
  const contactsByEmail = new Map<string, string[]>();
  const contactsByPhone = new Map<string, string[]>();
  for (const contact of contactRows) {
    const brand = String(contact.accountKey);
    const email = normalizeIdentityEmail(contact.email);
    const phone = normalizeIdentityPhone(contact.phone);
    if (email) contactsByEmail.set(`${brand}:${email}`, [...(contactsByEmail.get(`${brand}:${email}`) ?? []), String(contact.contactUuid)]);
    if (phone) contactsByPhone.set(`${brand}:${phone}`, [...(contactsByPhone.get(`${brand}:${phone}`) ?? []), String(contact.contactUuid)]);
  }

  const summary = {
    inputRows: rows.length,
    importedRows: 0,
    skippedRows: 0,
    byBrand: { medsystems: 0, beautysystems: 0 },
    byChannel: { meta_ads: 0, google_ads: 0, unknown: 0 },
    rdMatches: 0,
    rdUnmatched: 0,
  };

  for (const row of rows) {
    const brand = accountKey(row.client_slug);
    const convertedAt = new Date(String(row.converted_at ?? ""));
    const email = normalizeIdentityEmail(row.lead_email);
    const phone = normalizeIdentityPhone(row.lead_phone);
    const name = normalizeIdentityName(row.lead_name);
    if (!brand || Number.isNaN(convertedAt.valueOf()) || (!email && !phone)) { summary.skippedRows += 1; continue; }

    const emailCandidates = email ? contactsByEmail.get(`${brand}:${email}`) ?? [] : [];
    const phoneCandidates = phone ? contactsByPhone.get(`${brand}:${phone}`) ?? [] : [];
    let rdContactUuid: string | null = null;
    let rdMatchMethod: string | null = null;
    if (emailCandidates.length === 1) { rdContactUuid = emailCandidates[0]!; rdMatchMethod = "email_unico"; }
    else if (phoneCandidates.length === 1) { rdContactUuid = phoneCandidates[0]!; rdMatchMethod = "telefone_unico"; }
    if (rdContactUuid) summary.rdMatches += 1;
    else summary.rdUnmatched += 1;

    const normalizedSource = normalizeLabel(row.utm_source);
    const normalizedCampaign = normalizeLabel(row.utm_campaign);
    const normalizedEvent = normalizeLabel(row.conversion_event);
    const normalizedChannel = channel(row.utm_source);
    const identitySeed = email ? `email:${email}` : `phone:${phone}`;
    const identityHash = digest(`${brand}|${identitySeed}`);
    const sourceRecordHash = digest([
      brand,
      identitySeed,
      convertedAt.toISOString(),
      normalizedSource ?? "",
      normalizedCampaign ?? "",
      normalizedEvent ?? "",
    ].join("|"));

    await db.execute(
      `INSERT INTO leadReferenceEvents
        (source, sourceRecordHash, accountKey, sourceClientSlug, convertedAt, identityHash, emailHash, phoneHash, namePhoneHash, channel, utmSource, utmCampaign, conversionEvent, rdContactUuid, rdMatchMethod, rdEventConfirmed)
       VALUES ('supabase_export', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE accountKey=VALUES(accountKey), sourceClientSlug=VALUES(sourceClientSlug), convertedAt=VALUES(convertedAt), identityHash=VALUES(identityHash), emailHash=VALUES(emailHash), phoneHash=VALUES(phoneHash), namePhoneHash=VALUES(namePhoneHash), channel=VALUES(channel), utmSource=VALUES(utmSource), utmCampaign=VALUES(utmCampaign), conversionEvent=VALUES(conversionEvent), rdContactUuid=VALUES(rdContactUuid), rdMatchMethod=VALUES(rdMatchMethod)`,
      [sourceRecordHash, brand, clean(row.client_slug)!, convertedAt, identityHash, email ? digest(email) : null, phone ? digest(phone) : null, name && phone ? digest(`${name}|${phone}`) : null, normalizedChannel, normalizedSource, normalizedCampaign, normalizedEvent, rdContactUuid, rdMatchMethod],
    );
    summary.importedRows += 1;
    summary.byBrand[brand] += 1;
    summary.byChannel[normalizedChannel] += 1;
  }

  await db.execute(
    `INSERT INTO leadReferenceBenchmarks (businessDate, accountKey, sourceLabel, reportedLeads, note)
     VALUES ('2026-09-01','medsystems','Gestor Patrick',39,'Número informado em 02/09/2026; filtro que reduz a base de 41 para 39 ainda não documentado.'),
            ('2026-09-01','beautysystems','Gestor Patrick',45,'Número informado em 02/09/2026 e reproduzido pela base de referência.')
     ON DUPLICATE KEY UPDATE reportedLeads=VALUES(reportedLeads), note=VALUES(note)`,
  );

  console.log(JSON.stringify(summary, null, 2));
} finally {
  await db.end();
}
