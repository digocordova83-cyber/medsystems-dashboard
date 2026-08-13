import { getDb } from "../server/db.ts";
import { rdStationContacts } from "../drizzle/schema.ts";

const db = await getDb();
const contacts = await db.select().from(rdStationContacts).limit(3);
const output = contacts.map(contact => {
  const raw = JSON.parse(contact.rawPayload);
  return {
    accountKey: contact.accountKey,
    rawKeys: Object.keys(raw).sort(),
    created_at: raw.created_at ?? null,
    last_conversion_date: raw.last_conversion_date ?? null,
    first_conversion_date: raw.first_conversion_date ?? null,
  };
});
console.log(JSON.stringify(output, null, 2));
process.exit(0);
