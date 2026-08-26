import mysql from "mysql2/promise";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não disponível");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT accountKey, contactUuid, createdAtRd, lastConversionAt, rawPayload FROM rdStationContacts WHERE createdAtRd >= '2026-08-22' ORDER BY createdAtRd DESC LIMIT 5`);
  for (const row of rows) {
    const payload = JSON.parse(row.rawPayload);
    console.log(JSON.stringify({ accountKey: row.accountKey, contactUuid: row.contactUuid, createdAtRd: row.createdAtRd, lastConversionAt: row.lastConversionAt, payloadKeys: Object.keys(payload).sort(), payload }, null, 2));
  }
} finally {
  await db.end();
}
