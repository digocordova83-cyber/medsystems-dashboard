import fs from "node:fs";

const resultPath = process.argv[2];
if (!resultPath) throw new Error("Informe o caminho do resultado Windsor.ai.");

const wrapper = JSON.parse(fs.readFileSync(resultPath, "utf8"));
const text = wrapper?.content?.find(item => typeof item?.text === "string")?.text;
if (!text) throw new Error("O resultado Windsor.ai não contém uma resposta textual.");

const rows = JSON.parse(text);
const byAd = new Map();

for (const row of rows) {
  const key = String(row.ad_id ?? "").trim();
  if (!key) continue;
  const current = byAd.get(key) ?? {
    accountId: String(row.account_id ?? ""),
    accountName: String(row.account_name ?? ""),
    campaignId: String(row.campaign_id ?? ""),
    campaignName: String(row.campaign ?? "Sem campanha"),
    campaignStatus: String(row.campaign_effective_status ?? ""),
    adId: key,
    adName: String(row.ad_name ?? "Sem nome"),
    effectiveStatus: String(row.effective_status ?? ""),
    previewUrl: row.ad_preview_shareable_link ?? null,
    thumbnailUrl: row.thumbnail_url ?? row.image_url ?? null,
    spend: 0,
    leads: 0,
    firstDate: String(row.date ?? ""),
    lastDate: String(row.date ?? ""),
  };
  current.spend += Number(row.spend ?? 0);
  current.leads += Number(row.actions_lead ?? 0);
  if (String(row.date ?? "") < current.firstDate) current.firstDate = String(row.date ?? "");
  if (String(row.date ?? "") > current.lastDate) current.lastDate = String(row.date ?? "");
  if (!current.previewUrl && row.ad_preview_shareable_link) current.previewUrl = row.ad_preview_shareable_link;
  if (!current.thumbnailUrl && (row.thumbnail_url || row.image_url)) current.thumbnailUrl = row.thumbnail_url ?? row.image_url;
  byAd.set(key, current);
}

const ads = [...byAd.values()].sort((a, b) => b.spend - a.spend || b.leads - a.leads);
const campaigns = new Map();
for (const ad of ads) {
  const key = `${ad.accountId}:${ad.campaignId}`;
  const item = campaigns.get(key) ?? { accountId: ad.accountId, campaignId: ad.campaignId, campaignName: ad.campaignName, ads: 0, spend: 0, leads: 0 };
  item.ads += 1;
  item.spend += ad.spend;
  item.leads += ad.leads;
  campaigns.set(key, item);
}

const representativeAds = [];
const representedCampaigns = new Set();
for (const ad of ads) {
  const key = `${ad.accountId}:${ad.campaignId}`;
  if (representedCampaigns.has(key)) continue;
  representedCampaigns.add(key);
  representativeAds.push(ad);
}

console.log(JSON.stringify({
  rowCount: rows.length,
  activeAds: ads.length,
  activeCampaigns: campaigns.size,
  activeAdIds: ads.map(ad => ad.adId),
  byAccount: Object.values(Object.groupBy(ads, ad => ad.accountId)).map(group => ({
    accountId: group[0]?.accountId,
    accountName: group[0]?.accountName,
    ads: group.length,
    campaigns: new Set(group.map(ad => ad.campaignId)).size,
    spend: group.reduce((sum, ad) => sum + ad.spend, 0),
    leads: group.reduce((sum, ad) => sum + ad.leads, 0),
  })),
  campaigns: [...campaigns.values()].sort((a, b) => b.spend - a.spend),
  representativeAds,
  topAds: ads.slice(0, 80),
}, null, 2));
