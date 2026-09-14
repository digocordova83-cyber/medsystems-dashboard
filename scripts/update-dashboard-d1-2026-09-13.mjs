import { eq } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { rdStationAccounts } from "../drizzle/schema.ts";
import { syncConversionBatchForPeriod, syncNextContactPage } from "../server/rdstation/service.ts";
import { syncMedsystemsEntityForPeriod, syncMedsystemsReferencedContactsForPeriod } from "../server/bitrix24/service.ts";
import { syncPublyaPeriod } from "../server/publya/service.ts";
import { reconcilePaidMediaBusinessDate } from "../server/leads/dailyReconciliation.ts";

const period = "2026-09";
const businessDate = "2026-09-13";
const eventStart = new Date("2026-09-01T00:00:00-03:00");
const eventEnd = new Date("2026-09-14T00:00:00-03:00");
const accountKeys = ["medsystems", "beautysystems"];

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function syncRdAccount(accountKey) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  await db.update(rdStationAccounts)
    .set({ contactSyncPage: 1, contactsSyncedAt: null })
    .where(eq(rdStationAccounts.accountKey, accountKey));

  let importedContacts = 0;
  let pageRuns = 0;
  for (; pageRuns < 100; pageRuns += 1) {
    const page = await syncNextContactPage(accountKey);
    importedContacts += page.imported;
    if (page.complete) break;
    await sleep(200);
  }
  if (pageRuns >= 100) throw new Error(`Paginação RD Station excedeu o limite seguro para ${accountKey}.`);

  let contactsProcessed = 0;
  let eventsStored = 0;
  let afterId = 0;
  for (let batch = 0; batch < 100; batch += 1) {
    const result = await syncConversionBatchForPeriod(accountKey, eventStart, eventEnd, afterId);
    contactsProcessed += result.contactsProcessed;
    eventsStored += result.eventsStored;
    if (result.complete) break;
    afterId = result.nextCursor;
    await sleep(250);
  }

  return { importedContacts, contactsProcessed, eventsStored };
}

try {
  const rdStation = {};
  for (const accountKey of accountKeys) rdStation[accountKey] = await syncRdAccount(accountKey);

  const bitrix = {
    leads: await syncMedsystemsEntityForPeriod("lead", period),
    deals: await syncMedsystemsEntityForPeriod("deal", period),
    contacts: await syncMedsystemsReferencedContactsForPeriod(period),
  };
  const publya = await syncPublyaPeriod("2026-09-01", businessDate);
  const snapshot = await reconcilePaidMediaBusinessDate(businessDate);

  console.log(JSON.stringify({ businessDate, rdStation, bitrix, publya, snapshot }, null, 2));
} finally {
  process.exit(0);
}
