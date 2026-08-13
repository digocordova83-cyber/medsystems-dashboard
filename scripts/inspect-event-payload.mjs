import { getAccountByKey } from "../server/db.ts";
import { decryptSecret } from "../server/rdstation/crypto.ts";

const accountKey = "medsystems";
const contactUuid = "b58536a2-9d56-4440-84e1-ecce1434d69a";
const account = await getAccountByKey(accountKey);
const accessToken = decryptSecret(account.accessTokenCiphertext);
const response = await fetch(`https://api.rd.services/platform/contacts/${contactUuid}/events?event_type=CONVERSION&order=created_at:asc&page=1`, {
  headers: { accept: "application/json", authorization: `Bearer ${accessToken}` },
});
const payload = await response.json();
const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : []);
const event = events[0] ?? null;

console.log(JSON.stringify({
  status: response.status,
  responseIsArray: Array.isArray(payload),
  topLevelKeys: Array.isArray(payload) ? [] : Object.keys(payload ?? {}),
  eventCount: events.length,
  eventKeys: event ? Object.keys(event) : [],
  eventPreview: event ? {
    created_at: event.created_at,
    event_type: event.event_type,
    event_family: event.event_family,
    event_identifier: event.event_identifier,
    traffic_source: event.traffic_source,
    conversion_origin: event.conversion_origin,
    conversion_resource: event.conversion_resource,
  } : null,
  nestedPayloadKeys: event?.payload && typeof event.payload === "object" ? Object.keys(event.payload) : [],
  nestedPayloadPreview: event?.payload && typeof event.payload === "object" ? {
    traffic_source: event.payload.traffic_source,
    conversion_origin: event.payload.conversion_origin,
    conversion_resource: event.payload.conversion_resource,
    source: event.payload.source,
    channel: event.payload.channel,
    resource: event.payload.resource,
  } : null,
}, null, 2));
process.exit(0);
