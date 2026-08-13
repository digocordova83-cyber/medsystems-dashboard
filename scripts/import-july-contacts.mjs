import { syncNextContactPage } from "../server/rdstation/service.ts";

const accounts = (process.env.RD_CONTACT_ACCOUNTS ?? "medsystems,beautysystems")
  .split(",")
  .map(value => value.trim())
  .filter(Boolean);
const results = [];
const pagesPerAccount = Number(process.env.RD_CONTACT_PAGES_PER_RUN ?? 3);

for (const accountKey of accounts) {
  for (let sequence = 1; sequence <= pagesPerAccount; sequence += 1) {
    try {
      const result = await syncNextContactPage(accountKey);
      results.push({ accountKey, sequence, ...result });
      if (result.complete) break;
    } catch (error) {
      results.push({ accountKey, sequence, error: error instanceof Error ? error.message : "Erro desconhecido" });
      break;
    }
  }
}

console.log(JSON.stringify({ results }, null, 2));
process.exit(0);
