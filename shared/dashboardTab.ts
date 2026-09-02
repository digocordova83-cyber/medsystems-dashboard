export const DASHBOARD_TAB_IDS = ["overview", "google", "meta", "programmatic", "bitrix"] as const;

export type DashboardTab = (typeof DASHBOARD_TAB_IDS)[number];

export function dashboardTabFromHash(hash: string): DashboardTab {
  const rawRequested = hash.replace(/^#/, "");
  if (rawRequested === "leads") return "bitrix";
  const requested = rawRequested as DashboardTab;
  return DASHBOARD_TAB_IDS.includes(requested) ? requested : "overview";
}
