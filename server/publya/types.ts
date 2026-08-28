export const PUBLYA_GROUP_TYPES = [
  "formats",
  "creatives",
  "sites",
  "publishers",
  "devices",
  "cities",
  "states",
  "regions",
  "channels",
  "strategies",
  "placements",
] as const;

export type PublyaGroupType = (typeof PUBLYA_GROUP_TYPES)[number];

export type PublyaMetricSet = {
  impressions?: number;
  publisherImpressions?: number;
  reach?: number;
  frequency?: number;
  clicks?: number;
  ctr?: number;
  spend?: number;
  cpm?: number;
  cpc?: number;
  viewability?: number;
  conversion?: {
    conversions?: number;
    leads?: number;
  };
};

export type PublyaCampaignItem = {
  id: number;
  name: string;
  platform?: { id?: number; name?: string };
  startDate?: string;
  endDate?: string;
  status?: string;
};

export type PublyaCampaignDetail = {
  metrics?: PublyaMetricSet;
  groups?: Partial<Record<PublyaGroupType, Array<{
    name?: string;
    metrics?: PublyaMetricSet;
    thumbnailUrl?: string;
    previewFormats?: unknown;
    dimensions?: unknown;
  }>>>;
};

export type PublyaDailyPayload = Record<string, unknown>;
