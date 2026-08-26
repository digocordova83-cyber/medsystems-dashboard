import mysql from "mysql2/promise";
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT bitrixId, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND title='Oportunidade do RD Station' AND createdAtBitrix >= '2026-08-01 03:00:00' AND createdAtBitrix < '2026-08-25 03:00:00' LIMIT 1`);
  const p = JSON.parse(rows[0].rawPayload);
  const selected = Object.fromEntries(Object.entries(p).filter(([key, value]) => /email|phone|rd|station|utm|source|event/i.test(key) || String(value).includes('@')));
  console.log(JSON.stringify({bitrixId: rows[0].bitrixId, selected}, null, 2));
} finally { await db.end(); }
