import fs from "node:fs/promises";

const sources = [
  { brand: "Medsystems", platform: "Google Ads", path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-09-59.874876925_windsor-ai_get_data_4a4e4faf.json", urlFields: ["ad_final_urls", "ad_final_url_suffix", "ad_tracking_url_template", "campaign_tracking_setting_tracking_url"] },
  { brand: "BeautySystems", platform: "Google Ads", path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-10-10.174919084_windsor-ai_get_data_3da24fef.json", urlFields: ["ad_final_urls", "ad_final_url_suffix", "ad_tracking_url_template", "campaign_tracking_setting_tracking_url"] },
  { brand: "Medsystems", platform: "Meta Ads", path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-10-57.248345163_windsor-ai_get_data_39a2a77f.json", urlFields: ["website_destination_url", "link_url", "object_url", "url_tags"] },
  { brand: "BeautySystems", platform: "Meta Ads", path: "/home/ubuntu/.mcp/tool-results/2026-08-14_19-11-15.086787317_windsor-ai_get_data_4cb5f0fa.json", urlFields: ["website_destination_url", "link_url", "object_url", "url_tags"] },
];

function values(value) {
  if (!value || typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [value];
  } catch {
    return [value];
  }
}

function extract(url) {
  try {
    const parsed = url.includes("://") ? new URL(url) : new URL(`https://tracking.local/?${url.replace(/^\?/, "")}`);
    return {
      url,
      landingPage: url.includes("://") ? `${parsed.origin}${parsed.pathname}` : null,
      utmSource: parsed.searchParams.get("utm_source"),
      utmMedium: parsed.searchParams.get("utm_medium"),
      utmCampaign: parsed.searchParams.get("utm_campaign"),
      utmContent: parsed.searchParams.get("utm_content"),
      utmTerm: parsed.searchParams.get("utm_term"),
    };
  } catch {
    return null;
  }
}

const inventory = [];
for (const source of sources) {
  const envelope = JSON.parse(await fs.readFile(source.path, "utf8"));
  const rows = JSON.parse(envelope.content?.[0]?.text ?? "[]");
  const campaigns = new Map();
  for (const row of rows) {
    const key = `${row.campaign_id}|${row.campaign_name}`;
    const current = campaigns.get(key) ?? { brand: source.brand, platform: source.platform, campaignId: String(row.campaign_id ?? ""), campaignName: row.campaign_name ?? "Não identificado", adIds: new Set(), urls: new Map() };
    if (row.ad_id) current.adIds.add(String(row.ad_id));
    for (const field of source.urlFields) {
      for (const rawUrl of values(row[field])) {
        const parsed = extract(rawUrl);
        if (parsed?.utmSource || parsed?.utmCampaign || parsed?.utmTerm || parsed?.landingPage) current.urls.set(rawUrl, parsed);
      }
    }
    campaigns.set(key, current);
  }
  for (const campaign of campaigns.values()) {
    inventory.push({ ...campaign, adIds: [...campaign.adIds], urls: [...campaign.urls.values()] });
  }
}

console.log(JSON.stringify(inventory, null, 2));
