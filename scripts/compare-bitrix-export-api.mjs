import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const exportMap = JSON.parse(await readFile("/tmp/bitrix-export-id-map.json", "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute(`
  SELECT bitrixId, createdAtBitrix, JSON_UNQUOTE(JSON_EXTRACT(rawPayload, '$.UF_CRM_1739195085')) AS pipeline
  FROM bitrix24Entities
  WHERE entityType = 'lead'
    AND createdAtBitrix >= '2026-08-01 03:00:00'
    AND createdAtBitrix < '2026-08-20 03:00:00'
`);
await connection.end();

const pipelines = {
  Medsystems: "15391",
  "Negócios e Redes": "15395",
};
const result = {};
for (const [label, code] of Object.entries(pipelines)) {
  const exportIds = new Set(Object.entries(exportMap).filter(([, pipeline]) => pipeline === label).map(([id]) => id));
  const apiIds = new Set(rows.filter(row => String(row.pipeline ?? "") === code).map(row => String(row.bitrixId)));
  const extrasByDay = rows
    .filter(row => String(row.pipeline ?? "") === code && !exportIds.has(String(row.bitrixId)))
    .reduce((accumulator, row) => {
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date(row.createdAtBitrix));
      accumulator[day] = (accumulator[day] ?? 0) + 1;
      return accumulator;
    }, {});
  result[label] = {
    exportados: exportIds.size,
    retornadosPelaApi: apiIds.size,
    emAmbasAsFontes: [...exportIds].filter(id => apiIds.has(id)).length,
    somenteNaExportacao: [...exportIds].filter(id => !apiIds.has(id)).length,
    somenteNaApi: [...apiIds].filter(id => !exportIds.has(id)).length,
    somenteNaApiPorDataCriacao: extrasByDay,
  };
}

console.log(JSON.stringify(result, null, 2));
