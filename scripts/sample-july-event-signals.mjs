import { and, eq, gte, lt, or } from "drizzle-orm";
import { getDb, getAccountByKey } from "../server/db.ts";
import { rdStationContacts } from "../drizzle/schema.ts";
import { decryptSecret } from "../server/rdstation/crypto.ts";

const start = new Date("2026-07-01T00:00:00.000Z");
const end = new Date("2026-08-01T00:00:00.000Z");
const accounts = ["medsystems", "beautysystems"];

function decodeTrafficSource(value) {
  if (typeof value !== "string") return "(ausente)";
  try {
    const source = value.startsWith("encoded_") ? value.slice("encoded_".length) : value;
    const decoded = JSON.parse(Buffer.from(source, "base64").toString("utf8"));
    return String(decoded.current_session?.value ?? decoded.first_session?.value ?? "(ausente)");
  } catch {
    return value;
  }
}

const output = {};
const db = await getDb();
for (const accountKey of accounts) {
  const account = await getAccountByKey(accountKey);
  const token = decryptSecret(account.accessTokenCiphertext);
  const candidates = await db.select({ uuid: rdStationContacts.contactUuid })
    .from(rdStationContacts)
    .where(and(eq(rdStationContacts.accountKey, accountKey), or(
      and(gte(rdStationContacts.createdAtRd, start), lt(rdStationContacts.createdAtRd, end)),
      and(gte(rdStationContacts.lastConversionAt, start), lt(rdStationContacts.lastConversionAt, end)),
    )))
    .limit(10);
  const sources = new Map();
  const families = new Map();
  const identifiers = new Map();
  for (const candidate of candidates) {
    const response = await fetch(`https://api.rd.services/platform/contacts/${candidate.uuid}/events?event_type=CONVERSION&order=created_at&direction=asc&page=1`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    const events = await response.json();
    for (const event of Array.isArray(events) ? events : []) {
      const source = decodeTrafficSource(event?.payload?.traffic_source);
      sources.set(source, (sources.get(source) ?? 0) + 1);
      const family = String(event?.event_family ?? "(ausente)");
      families.set(family, (families.get(family) ?? 0) + 1);
      const identifier = String(event?.event_identifier ?? event?.payload?.conversion_identifier ?? "(ausente)");
      identifiers.set(identifier, (identifiers.get(identifier) ?? 0) + 1);
    }
  }
  const top = map => Object.fromEntries([...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20));
  output[accountKey] = { candidates: candidates.length, sources: top(sources), families: top(families), identifiers: top(identifiers) };
}
console.log(JSON.stringify(output, null, 2));
process.exit(0);
