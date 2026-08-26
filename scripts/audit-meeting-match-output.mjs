import fs from "node:fs/promises";
const data = JSON.parse(await fs.readFile("/tmp/meeting-match-rd-bitrix-2026-08-01-a-2026-08-23.json", "utf8"));
const stats = { rows: data.rows.length, rdWithEmail: 0, rdWithPhone: 0, rdWithName: 0, matchWithEmail: 0, matchWithPhone: 0, matchWithName: 0, bitrixRawWithEmail: 0, bitrixRawWithPhone: 0 };
const examples = [];
for (const row of data.rows) {
  const rd = row.rd;
  if (rd.email) stats.rdWithEmail++;
  if (rd.phone) stats.rdWithPhone++;
  if (rd.name) stats.rdWithName++;
  if (row.match?.fields?.emails?.length) stats.bitrixRawWithEmail++;
  if (row.match?.fields?.phones?.length) stats.bitrixRawWithPhone++;
  if (row.match?.matchMethods?.includes("email")) stats.matchWithEmail++;
  if (row.match?.matchMethods?.includes("telefone")) stats.matchWithPhone++;
  if (row.match?.matchMethods?.includes("nome")) stats.matchWithName++;
  if (examples.length < 5 && row.match) examples.push({ rd: { accountKey: rd.accountKey, name: rd.name, email: rd.email, phone: rd.phone, emailKeys: rd.emailKeys, phoneKeys: rd.phoneKeys }, match: { bitrixId: row.match.bitrixId, methods: row.match.matchMethods, fields: { emails: row.match.fields.emails, phones: row.match.fields.phones, names: row.match.fields.names } } });
}
console.log(JSON.stringify({ stats, examples }, null, 2));
