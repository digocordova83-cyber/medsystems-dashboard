import { syncNextContactPage, updateSegmentation } from "../server/rdstation/service.ts";

const segments = {
  medsystems: "19993961",
  beautysystems: "19993973",
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncAccount(accountKey, segmentId) {
  await updateSegmentation(accountKey, segmentId);
  let pages = 0;
  let imported = 0;
  while (true) {
    let result;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        result = await syncNextContactPage(accountKey);
        break;
      } catch (error) {
        const retryable = /excedeu 30 segundos|502|timeout|fetch failed|connect timeout/i.test(String(error?.message ?? error));
        if (!retryable || attempt === 4) throw error;
        const waitMs = attempt * 15000;
        console.log(JSON.stringify({ accountKey, retry: attempt, waitMs, reason: "api_transitoria" }));
        await pause(waitMs);
      }
    }
    pages += 1;
    imported += result.imported;
    if (pages === 1 || pages % 10 === 0 || result.complete) {
      console.log(JSON.stringify({ accountKey, segmentId, pages, imported, page: result.page, total: result.total, complete: result.complete }));
    }
    if (result.complete) return { accountKey, segmentId, pages, imported, total: result.total };
  }
}

const results = await Promise.all(Object.entries(segments).map(([accountKey, segmentId]) => syncAccount(accountKey, segmentId)));
console.log(JSON.stringify({ results }, null, 2));
