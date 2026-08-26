import mysql from "mysql2/promise";
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query(`SELECT bitrixId, email, phone, fullName, rawPayload FROM bitrix24Entities WHERE entityType='lead' AND createdAtBitrix >= '2026-08-01 03:00:00' AND createdAtBitrix < '2026-08-25 03:00:00' AND LOWER(rawPayload) REGEXP 'utm' LIMIT 3`);
  for (const row of rows) {
    const p = JSON.parse(row.rawPayload);
    console.log(JSON.stringify({ bitrixId: row.bitrixId, columns: {email: row.email, phone: row.phone, fullName: row.fullName}, payloadKeys: Object.keys(p).sort(), selected: {ID:p.ID, TITLE:p.TITLE, NAME:p.NAME, EMAIL:p.EMAIL, PHONE:p.PHONE, SOURCE_ID:p.SOURCE_ID, SOURCE_DESCRIPTION:p.SOURCE_DESCRIPTION, UTM_SOURCE:p.UTM_SOURCE, UTM_MEDIUM:p.UTM_MEDIUM, UTM_CAMPAIGN:p.UTM_CAMPAIGN, UTM_CONTENT:p.UTM_CONTENT, UTM_TERM:p.UTM_TERM, UF_CRM_1739195085:p.UF_CRM_1739195085}}, null, 2));
  }
} finally { await db.end(); }
