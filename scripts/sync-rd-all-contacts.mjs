import { syncNextContactPage, updateSegmentation } from "../server/rdstation/service.ts";

const accounts = ["medsystems", "beautysystems"];
const maxPages = Number(process.env.MAX_PAGES ?? 1000);
const segmentationIds = { medsystems: "568976", beautysystems: "12510116" };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

if (process.env.RESET_CURSOR === "1") {
  await Promise.all(accounts.map(accountKey => updateSegmentation(accountKey, segmentationIds[accountKey])));
  console.log(JSON.stringify({ resetCursor: true, accounts }));
}

async function syncAccount(accountKey) {
  let pages = 0;
  let imported = 0;
  while (pages < maxPages) {
    let result;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        result = await syncNextContactPage(accountKey);
        break;
      } catch (error) {
        const retryable = /excedeu 30 segundos|502|timeout/i.test(String(error?.message ?? error));
        if (!retryable || attempt === 4) throw error;
        const delay = attempt * 15000;
        console.log(JSON.stringify({ accountKey, retry: attempt, waitMs: delay, reason: "timeout_transitorio" }));
        await pause(delay);
      }
    }
    pages += 1;
    imported += result.imported;
    if (pages === 1 || pages % 10 === 0 || result.complete) {
      console.log(JSON.stringify({ accountKey, pages, imported, page: result.page, total: result.total, complete: result.complete }));
    }
    if (result.complete) return { accountKey, pages, imported, total: result.total, complete: true };
  }
  throw new Error(`Limite de ${maxPages} páginas alcançado para ${accountKey}; a sincronização pode ser retomada com segurança.`);
}

const results = await Promise.all(accounts.map(syncAccount));
console.log(JSON.stringify({ results }, null, 2));
