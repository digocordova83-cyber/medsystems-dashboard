export type CampaignMetricRow = {
  id: number;
  platform: string;
  brand: string;
  accountId: string;
  reportDate: Date | string;
  campaignId: string;
  campaignName: string | null;
  spend: number;
  impressions: number;
  reach?: number;
  clicks: number;
  leads: number;
  rawPayload?: string | null;
  syncedAt: Date | string;
};

function timestamp(value: Date | string) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function campaignMetricKey(row: Pick<CampaignMetricRow, "platform" | "accountId" | "reportDate" | "campaignId">) {
  const date = new Date(row.reportDate).toISOString().slice(0, 10);
  return `${row.platform}|${row.accountId}|${date}|${row.campaignId}`;
}

export function dedupeCanonicalCampaignRows<T extends CampaignMetricRow>(rows: T[]) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const key = campaignMetricKey(row);
    const current = latest.get(key);
    if (!current || timestamp(row.syncedAt) > timestamp(current.syncedAt) || (timestamp(row.syncedAt) === timestamp(current.syncedAt) && row.id > current.id)) {
      latest.set(key, row);
    }
  }
  return Array.from(latest.values());
}

export function sumCampaignMetrics<T extends Pick<CampaignMetricRow, "spend" | "impressions" | "clicks" | "leads"> & { reach?: number }>(rows: T[]) {
  return rows.reduce((total, row) => ({
    spend: total.spend + Number(row.spend || 0),
    impressions: total.impressions + Number(row.impressions || 0),
    reach: total.reach + Number(row.reach || 0),
    clicks: total.clicks + Number(row.clicks || 0),
    leads: total.leads + Number(row.leads || 0),
  }), { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0 });
}
