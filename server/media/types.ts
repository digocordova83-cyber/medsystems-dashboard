export const mediaPlatforms = ["google_ads", "meta_ads"] as const;
export type MediaPlatform = (typeof mediaPlatforms)[number];

export function safeRatio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function cpl(spend: number, leads: number) {
  return safeRatio(spend, leads);
}

export function roas(revenue: number, spend: number) {
  return safeRatio(revenue, spend);
}
