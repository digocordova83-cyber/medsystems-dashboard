import mysql from "mysql2/promise";
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT bitrixId, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= '2026-08-01 03:00:00' AND createdAtBitrix < '2026-08-24 03:00:00' LIMIT 10`);
  for (const row of rows) {
    const p = JSON.parse(row.rawPayload);
    const selected = Object.fromEntries(Object.entries(p).filter(([key, value]) => /email|phone|rd|station|utm/i.test(key) || String(value).includes('@')));
    console.log(JSON.stringify({ bitrixId: row.bitrixId, selected }, null, 2));
  }
} finally { await db.end(); }
