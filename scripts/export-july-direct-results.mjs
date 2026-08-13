import { and, asc, eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { getDb } from "../server/db.ts";
import { rdStationContacts, rdStationJulyLeadViews } from "../drizzle/schema.ts";

const outDir = "/home/ubuntu/rdstation_exports";
await mkdir(outDir, { recursive: true });
const db = await getDb();

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportView(accountKey, viewType) {
  const rows = await db.select({
    conta: rdStationJulyLeadViews.accountKey,
    visao: rdStationJulyLeadViews.viewType,
    nome: rdStationContacts.name,
    email: rdStationContacts.email,
    telefone: rdStationContacts.phone,
    uuidContato: rdStationJulyLeadViews.contactUuid,
    dataContato: rdStationJulyLeadViews.contactDate,
    dataEvento: rdStationJulyLeadViews.eventTimestamp,
    origemClassificada: rdStationJulyLeadViews.sourceBucket,
    identificadorConversao: rdStationJulyLeadViews.eventIdentifier,
    familiaEvento: rdStationJulyLeadViews.eventFamily,
  }).from(rdStationJulyLeadViews)
    .innerJoin(rdStationContacts, and(
      eq(rdStationContacts.accountKey, rdStationJulyLeadViews.accountKey),
      eq(rdStationContacts.contactUuid, rdStationJulyLeadViews.contactUuid),
    ))
    .where(and(
      eq(rdStationJulyLeadViews.accountKey, accountKey),
      eq(rdStationJulyLeadViews.viewType, viewType),
      eq(rdStationJulyLeadViews.status, "qualificado"),
    ))
    .orderBy(asc(rdStationJulyLeadViews.eventTimestamp));
  const headers = Object.keys(rows[0] ?? {
    conta: "", visao: "", nome: "", email: "", telefone: "", uuidContato: "", dataContato: "", dataEvento: "", origemClassificada: "", identificadorConversao: "", familiaEvento: "",
  });
  const content = [headers.join(","), ...rows.map(row => headers.map(header => csvCell(row[header])).join(","))].join("\n");
  const fileName = `leads_julho_2026_${viewType}_conversao_${accountKey}.csv`;
  await writeFile(`${outDir}/${fileName}`, content, "utf8");
  return { accountKey, viewType, leadsQualificados: rows.length, fileName };
}

const summary = [];
for (const accountKey of ["medsystems", "beautysystems"]) {
  for (const viewType of ["primeira", "ultima"]) summary.push(await exportView(accountKey, viewType));
}
const summaryHeaders = ["conta", "visao", "leads_qualificados", "arquivo"];
await writeFile(`${outDir}/resumo_leads_julho_2026_api_direta.csv`, [summaryHeaders.join(","), ...summary.map(row => [row.accountKey, row.viewType, row.leadsQualificados, row.fileName].map(csvCell).join(","))].join("\n"), "utf8");
console.log(JSON.stringify({ outDir, summary }, null, 2));
