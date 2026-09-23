import { eq } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { rdStationAccounts } from "../drizzle/schema.ts";
import { syncConversionBatchForPeriod, syncNextContactPage } from "../server/rdstation/service.ts";
import { syncMedsystemsEntityForPeriod, syncMedsystemsReferencedContactsForPeriod } from "../server/bitrix24/service.ts";
import { syncPublyaPeriod } from "../server/publya/service.ts";
import { reconcilePaidMediaBusinessDate } from "../server/leads/dailyReconciliation.ts";

const period = "2026-09";
const businessDate = "2026-09-22";
const eventStart = new Date("2026-09-01T00:00:00-03:00");
const eventEnd = new Date("2026-09-23T00:00:00-03:00");
const accountKeys = ["medsystems", "beautysystems"];

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function syncRdAccount(accountKey) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  console.error(`[D-1] RD Station ${accountKey}: iniciando contatos.`);
  await db.update(rdStationAccounts)
    .set({ contactSyncPage: 1, contactsSyncedAt: null })
    .where(eq(rdStationAccounts.accountKey, accountKey));

  let importedContacts = 0;
  let pageRuns = 0;
  for (; pageRuns < 100; pageRuns += 1) {
    const page = await syncNextContactPage(accountKey);
    importedContacts += page.imported;
    if (page.complete) break;
    if ((pageRuns + 1) % 10 === 0) console.error(`[D-1] RD Station ${accountKey}: ${pageRuns + 1} páginas concluídas.`);
    await sleep(200);
  }
  if (pageRuns >= 100) throw new Error(`Paginação RD Station excedeu o limite seguro para ${accountKey}.`);

  console.error(`[D-1] RD Station ${accountKey}: iniciando eventos.`);
  let contactsProcessed = 0;
  let eventsStored = 0;
  let afterId = 0;
  for (let batch = 0; batch < 100; batch += 1) {
    const result = await syncConversionBatchForPeriod(accountKey, eventStart, eventEnd, afterId);
    contactsProcessed += result.contactsProcessed;
    eventsStored += result.eventsStored;
    if (result.complete) break;
    afterId = result.nextCursor;
    if ((batch + 1) % 10 === 0) console.error(`[D-1] RD Station ${accountKey}: ${batch + 1} lotes de eventos concluídos.`);
    await sleep(250);
  }

  console.error(`[D-1] RD Station ${accountKey}: concluído.`);
  return { importedContacts, contactsProcessed, eventsStored };
}

try {
  const rdStation = {};
  for (const accountKey of accountKeys) rdStation[accountKey] = await syncRdAccount(accountKey);

  console.error("[D-1] Bitrix24: sincronizando Leads, Negócios e Contatos referenciados.");
  const bitrix = {
    leads: await syncMedsystemsEntityForPeriod("lead", period),
    deals: await syncMedsystemsEntityForPeriod("deal", period),
    contacts: await syncMedsystemsReferencedContactsForPeriod(period),
  };

  console.error("[D-1] Publya e Push: sincronizando relatórios.");
  const publya = await syncPublyaPeriod("2026-09-01", businessDate);

  console.error("[D-1] Negócios: persistindo snapshot reconciliado.");
  const snapshot = await reconcilePaidMediaBusinessDate(businessDate);

  console.log(JSON.stringify({ businessDate, rdStation, bitrix, publya, snapshot }, null, 2));
} finally {
  process.exit(0);
}
