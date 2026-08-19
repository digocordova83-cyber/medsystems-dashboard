import { inspectDirectContactsPage } from "../server/rdstation/service.ts";

for (const accountKey of ["medsystems", "beautysystems"]) {
  const result = await inspectDirectContactsPage(accountKey, 1);
  console.log(JSON.stringify({ accountKey, ...result }, null, 2));
}
