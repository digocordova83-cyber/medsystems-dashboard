import { hydrateUtmContactPhones } from "../server/rdstation/service";

const start = new Date("2026-08-01T03:00:00.000Z");
const end = new Date("2026-08-18T03:00:00.000Z");
const limit = Number(process.env.RD_PHONE_HYDRATE_LIMIT ?? 30);

const result = {
  medsystems: await hydrateUtmContactPhones("medsystems", start, end, limit),
  beautysystems: await hydrateUtmContactPhones("beautysystems", start, end, limit),
};

console.log(JSON.stringify(result, null, 2));
