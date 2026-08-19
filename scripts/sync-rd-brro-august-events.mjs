import { syncAugustConversionBatch } from "../server/rdstation/service.ts";

const accounts = ["medsystems", "beautysystems"];
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncAccount(accountKey) {
  let cursor = 0;
  let batches = 0;
  let contacts = 0;
  let events = 0;
  while (true) {
    let result;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        result = await syncAugustConversionBatch(accountKey, cursor);
        break;
      } catch (error) {
        const retryable = /excedeu 30 segundos|502|timeout|fetch failed|connect timeout/i.test(String(error?.message ?? error));
        if (!retryable || attempt === 4) throw error;
        const waitMs = attempt * 15000;
        console.log(JSON.stringify({ accountKey, retry: attempt, waitMs, reason: "api_transitoria" }));
        await pause(waitMs);
      }
    }
    batches += 1;
    contacts += result.contactsProcessed;
    events += result.eventsStored;
    cursor = result.nextCursor;
    if (batches === 1 || batches % 10 === 0 || result.complete) {
      console.log(JSON.stringify({ accountKey, batches, contacts, events, cursor, complete: result.complete }));
    }
    if (result.complete) return { accountKey, batches, contacts, events };
  }
}

const results = await Promise.all(accounts.map(syncAccount));
console.log(JSON.stringify({ results }, null, 2));
