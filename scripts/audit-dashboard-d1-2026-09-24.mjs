import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import { qualifiesDirectApiEvent } from "../server/rdstation/filtering.ts";
import { medsystemsBitrixRdOpportunityDashboardsByAccount } from "../server/bitrix24/service.ts";
import { mediaChannelDashboard } from "../server/media/channelDashboard.ts";
import { programmaticDashboard } from "../server/publya/dashboard.ts";

const startDate = "2026-09-01";
const endDate = "2026-09-24";
const businessDate = "2026-09-24";
const startUtc = "2026-09-01 03:00:00";
const endUtcExclusive = "2026-09-25 03:00:00";
const officialAccounts = ["446269251699575", "1655942005167160", "672-710-7654", "864-759-2401"];
const filters = {
  pipeline: "all",
  responsible: "all",
  source: "all",
  stage: "all",
  position: "all",
  product: "all",
  campaign: "all",
  adset: "all",
  creative: "all",
};

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summarizeRdEvents(rows) {
  const perAccount = new Map();
  for (const row of rows) {
    const event = JSON.parse(row.rawPayload);
    if (!qualifiesDirectApiEvent(event).qualifies) continue;
    const item = perAccount.get(row.accountKey) ?? { events: 0, contacts: new Set(), maxEventAt: null };
    item.events += 1;
    item.contacts.add(String(row.contactUuid));
    const eventAt = new Date(row.eventCreatedAt);
    if (!item.maxEventAt || eventAt > item.maxEventAt) item.maxEventAt = eventAt;
    perAccount.set(row.accountKey, item);
  }
  return ["medsystems", "beautysystems"].map(accountKey => {
    const item = perAccount.get(accountKey) ?? { events: 0, contacts: new Set(), maxEventAt: null };
    return {
      accountKey,
      qualifiedEvents: item.events,
      qualifiedUniqueContacts: item.contacts.size,
      maxQualifiedEventAt: item.maxEventAt?.toISOString() ?? null,
    };
  });
}

function mediaRevenueCoverage(rows) {
  const result = {
    google_ads: { populatedRows: 0, attributedValue: 0, roas: null },
    meta_ads: { populatedRows: 0, attributedValue: 0, roas: null },
  };
  for (const row of rows) {
    const payload = JSON.parse(row.rawPayload);
    const value = row.platform === "google_ads" ? payload.conversions_value : payload.action_values_purchase;
    if (value !== null && value !== undefined && value !== "") {
      result[row.platform].populatedRows += 1;
      result[row.platform].attributedValue += number(value);
    }
  }
  return result;
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rdRows] = await connection.execute(`
    SELECT accountKey, contactUuid, eventCreatedAt, rawPayload
    FROM rdStationConversionEvents
    WHERE eventCreatedAt >= ? AND eventCreatedAt < ?
  `, [startUtc, endUtcExclusive]);
  const [rdAccountRows] = await connection.execute(`
    SELECT accountKey, status, contactSyncTotal, contactsSyncedAt, lastSyncAt, lastError
    FROM rdStationAccounts
    ORDER BY accountKey
  `);
  const [bitrixRows] = await connection.execute(`
    SELECT entityType, COUNT(*) AS total, MAX(createdAtBitrix) AS maxCreatedAt, MAX(syncedAt) AS maxSyncedAt
    FROM bitrix24Entities
    WHERE createdAtBitrix >= ? AND createdAtBitrix < ?
    GROUP BY entityType
    ORDER BY entityType
  `, [startUtc, "2026-10-01 03:00:00"]);
  const [mediaRows] = await connection.execute(`
    SELECT platform, brand, accountId, reportDate, campaignId, spend, impressions, clicks,
           platformLeads, platformConversions, rawPayload, syncedAt
    FROM mediaDailyPerformance
    WHERE recordLevel = 'campaign'
      AND reportDate >= '2026-09-01 03:00:00'
      AND reportDate < '2026-09-25 03:00:00'
      AND accountId IN (?, ?, ?, ?)
  `, officialAccounts);
  const [mediaIntegrityRows] = await connection.execute(`
    SELECT
      SUM(CASE WHEN campaignId LIKE 'name:%' THEN 1 ELSE 0 END) AS provisionalNameRows,
      COUNT(*) AS storedRows,
      COUNT(DISTINCT CONCAT(platform, '|', accountId, '|', DATE(reportDate), '|', campaignId, '|', COALESCE(adGroupId,''), '|', COALESCE(adId,''))) AS canonicalKeys,
      MAX(reportDate) AS maxReportDate,
      MAX(syncedAt) AS maxSyncedAt
    FROM mediaDailyPerformance
    WHERE recordLevel = 'campaign'
      AND reportDate >= '2026-09-01 03:00:00'
      AND reportDate < '2026-09-25 03:00:00'
      AND accountId IN (?, ?, ?, ?)
  `, officialAccounts);
  const [snapshotRows] = await connection.execute(`
    SELECT businessDate, accountKey, uniqueContacts, mqlContacts, sqlContacts, contactsWithDeals,
           uniqueBitrixLeadIds, peopleWithMultipleLeadIds, leadIdsInDuplicateGroups, extraLeadIds,
           ruleVersion, status, reconciledAt
    FROM paidMediaReconciliationDaily
    WHERE businessDate = ?
    ORDER BY accountKey
  `, [businessDate]);
  const [publyaRows] = await connection.execute(`
    SELECT clientId, status, lastSyncAt, lastDataDate, lastError
    FROM publyaAccounts
    WHERE clientId = 810
  `);
  const [pushRows] = await connection.execute(`
    SELECT COUNT(*) AS rowCount, MIN(reportDate) AS minDate, MAX(reportDate) AS maxDate,
           SUM(sends) AS sends, SUM(clicks) AS clicks, SUM(spend) AS spend, MAX(syncedAt) AS maxSyncedAt
    FROM publyaPushDaily
    WHERE clientId = 810
      AND reportDate >= '2026-09-01 03:00:00'
      AND reportDate < '2026-09-25 03:00:00'
  `);

  const [businessMtd, businessD1, googleAll, googleMed, googleBeauty, metaAll, metaMed, metaBeauty, programmatic] = await Promise.all([
    medsystemsBitrixRdOpportunityDashboardsByAccount({ startDate, endDate, filters }),
    medsystemsBitrixRdOpportunityDashboardsByAccount({ startDate: businessDate, endDate: businessDate, filters }),
    mediaChannelDashboard({ platform: "google_ads", brand: "all", startDate, endDate }),
    mediaChannelDashboard({ platform: "google_ads", brand: "medsystems", startDate, endDate }),
    mediaChannelDashboard({ platform: "google_ads", brand: "beautysystems", startDate, endDate }),
    mediaChannelDashboard({ platform: "meta_ads", brand: "all", startDate, endDate }),
    mediaChannelDashboard({ platform: "meta_ads", brand: "medsystems", startDate, endDate }),
    mediaChannelDashboard({ platform: "meta_ads", brand: "beautysystems", startDate, endDate }),
    programmaticDashboard({ startDate, endDate, reportKey: "all" }),
  ]);

  const compactBusiness = dashboards => Object.fromEntries(Object.entries(dashboards).map(([accountKey, dashboard]) => [accountKey, {
    totals: dashboard.totals,
    duplicates: dashboard.duplicates,
    period: dashboard.period,
  }]));
  const compactMedia = dashboard => ({
    period: dashboard.period,
    totals: dashboard.totals,
    activeStatusAsOf: dashboard.methodology.activeStatusAsOf,
    activeCreativeRows: dashboard.activeCreatives.length,
    activeCreativeRowsWithThumbnail: dashboard.activeCreatives.filter(row => row.thumbnailUrl).length,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    period: { startDate, endDate, timezone: "America/Sao_Paulo" },
    rdStation: { accounts: rdAccountRows, mtd: summarizeRdEvents(rdRows) },
    bitrix: bitrixRows,
    business: { mtd: compactBusiness(businessMtd), d1: compactBusiness(businessD1), snapshot: snapshotRows },
    media: {
      google: { all: compactMedia(googleAll), medsystems: compactMedia(googleMed), beautysystems: compactMedia(googleBeauty) },
      meta: { all: compactMedia(metaAll), medsystems: compactMedia(metaMed), beautysystems: compactMedia(metaBeauty) },
      integrity: mediaIntegrityRows[0],
      revenueCoverage: mediaRevenueCoverage(mediaRows),
    },
    programmatic: {
      connection: programmatic.connection,
      period: programmatic.period,
      totals: programmatic.totals,
      campaigns: programmatic.campaigns.map(row => ({
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        platform: row.platform,
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        leads: row.leads,
        conversions: row.conversions,
        counted: row.counted,
        duplicateOf: row.duplicateOf,
        dataDate: row.dataDate,
      })),
      push: programmatic.push,
      quality: programmatic.quality,
      warnings: programmatic.warnings,
      account: publyaRows[0] ?? null,
      pushDatabase: pushRows[0] ?? null,
    },
  };

  const path = "/tmp/medsystems-d1-2026-09-24/audit.json";
  await fs.writeFile(path, JSON.stringify(output, null, 2), "utf8");
  console.log(path);
} finally {
  await connection.end();
}

process.exit(0);
