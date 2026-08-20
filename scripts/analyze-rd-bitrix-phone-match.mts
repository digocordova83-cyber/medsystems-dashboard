import { rdUtmPhoneMatchFlow } from "../server/db";

const start = new Date("2026-08-01T03:00:00.000Z");
const end = new Date("2026-08-18T03:00:00.000Z");
const result = await rdUtmPhoneMatchFlow(["medsystems", "beautysystems"], start, end);
console.log(JSON.stringify(result, null, 2));
