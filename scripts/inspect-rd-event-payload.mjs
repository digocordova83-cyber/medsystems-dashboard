import mysql from "mysql2/promise";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não disponível");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT accountKey, contactUuid, eventUuid, eventType, eventFamily, eventIdentifier, eventCreatedAt, rawPayload FROM rdStationConversionEvents WHERE eventCreatedAt >= '2026-08-20' ORDER BY eventCreatedAt DESC LIMIT 8`);
  for (const row of rows) {
    console.log(JSON.stringify({ ...row, payload: JSON.parse(row.rawPayload) }, null, 2));
  }
} finally {
  await db.end();
}
