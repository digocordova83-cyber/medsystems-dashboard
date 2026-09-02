export const DASHBOARD_TAB_IDS = ["overview", "google", "meta", "programmatic", "leads", "bitrix"] as const;

export type DashboardTab = (typeof DASHBOARD_TAB_IDS)[number];

export function dashboardTabFromHash(hash: string): DashboardTab {
  const requested = hash.replace(/^#/, "") as DashboardTab;
  return DASHBOARD_TAB_IDS.includes(requested) ? requested : "overview";
}
