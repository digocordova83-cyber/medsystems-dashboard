import mysql from "mysql2/promise";
import { qualifiesDirectApiEvent } from "../server/rdstation/filtering.ts";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.execute(`
    SELECT e.accountKey, e.contactUuid, e.rawPayload
    FROM rdStationConversionEvents e
    WHERE e.eventCreatedAt >= '2026-09-13 03:00:00'
      AND e.eventCreatedAt < '2026-09-14 03:00:00'
  `);

  const contactsByAccount = new Map();
  const eventsByAccount = new Map();
  for (const row of rows) {
    const event = JSON.parse(row.rawPayload);
    if (!qualifiesDirectApiEvent(event).qualifies) continue;
    const account = String(row.accountKey);
    eventsByAccount.set(account, (eventsByAccount.get(account) ?? 0) + 1);
    if (!contactsByAccount.has(account)) contactsByAccount.set(account, new Set());
    contactsByAccount.get(account).add(String(row.contactUuid));
  }
  const summary = ["medsystems", "beautysystems"].map(accountKey => ({
    accountKey,
    events: eventsByAccount.get(accountKey) ?? 0,
    uniqueContacts: contactsByAccount.get(accountKey)?.size ?? 0,
  }));
  console.log(JSON.stringify({ businessDate: "2026-09-13", summary }, null, 2));
} finally {
  await connection.end();
}
