import { double, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

const accountKeyValues = ["medsystems", "beautysystems"] as const;
const integrationStatusValues = ["desconectada", "pronta", "sincronizando", "erro"] as const;
const julyViewValues = ["primeira", "ultima"] as const;
const julyLeadStatusValues = ["pendente", "qualificado", "rejeitado"] as const;
const bitrixEntityTypeValues = ["lead", "contact", "deal"] as const;
const mediaPlatformValues = ["google_ads", "meta_ads"] as const;
const mediaRecordLevelValues = ["campaign", "ad"] as const;
const attributionStatusValues = ["not_identified", "channel_signal", "identified"] as const;
const attributionMethodValues = ["none", "utm_source", "utm_campaign", "identifier"] as const;
const publyaGroupTypeValues = ["formats", "creatives", "sites", "publishers", "devices", "cities", "states", "regions", "channels", "strategies", "placements"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const dashboardAccessLogs = mysqlTable("dashboardAccessLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  username: varchar("username", { length: 64 }).notNull(),
  result: mysqlEnum("result", ["success", "failure", "logout"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 128 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("dashboard_access_created_index").on(table.createdAt),
  index("dashboard_access_username_index").on(table.username, table.createdAt),
]);

export const rdStationAccounts = mysqlTable("rdStationAccounts", {
  id: int("id").autoincrement().primaryKey(),
  accountKey: mysqlEnum("accountKey", accountKeyValues).notNull().unique(),
  displayName: varchar("displayName", { length: 80 }).notNull(),
  status: mysqlEnum("status", integrationStatusValues).default("desconectada").notNull(),
  segmentationId: varchar("segmentationId", { length: 128 }),
  contactSyncPage: int("contactSyncPage").default(1).notNull(),
  contactSyncTotal: int("contactSyncTotal").default(0).notNull(),
  contactsSyncedAt: timestamp("contactsSyncedAt"),
  oauthStateHash: varchar("oauthStateHash", { length: 128 }),
  oauthStateExpiresAt: timestamp("oauthStateExpiresAt"),
  accessTokenCiphertext: text("accessTokenCiphertext"),
  refreshTokenCiphertext: text("refreshTokenCiphertext"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  authorizedAt: timestamp("authorizedAt"),
  lastSyncAt: timestamp("lastSyncAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const rdStationContacts = mysqlTable("rdStationContacts", {
  id: int("id").autoincrement().primaryKey(),
  accountKey: mysqlEnum("accountKey", accountKeyValues).notNull(),
  contactUuid: varchar("contactUuid", { length: 128 }).notNull(),
  name: varchar("name", { length: 320 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  createdAtRd: timestamp("createdAtRd"),
  lastConversionAt: timestamp("lastConversionAt"),
  eventsSyncedAt: timestamp("eventsSyncedAt"),
  rawPayload: text("rawPayload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("rd_contacts_account_uuid_unique").on(table.accountKey, table.contactUuid),
  index("rd_contacts_account_events_index").on(table.accountKey, table.eventsSyncedAt),
]);

export const rdStationConversionEvents = mysqlTable("rdStationConversionEvents", {
  id: int("id").autoincrement().primaryKey(),
  accountKey: mysqlEnum("accountKey", accountKeyValues).notNull(),
  contactUuid: varchar("contactUuid", { length: 128 }).notNull(),
  eventUuid: varchar("eventUuid", { length: 160 }).notNull(),
  eventType: varchar("eventType", { length: 64 }),
  eventFamily: varchar("eventFamily", { length: 64 }),
  eventIdentifier: varchar("eventIdentifier", { length: 320 }),
  eventCreatedAt: timestamp("eventCreatedAt").notNull(),
  rawPayload: text("rawPayload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("rd_events_account_event_unique").on(table.accountKey, table.eventUuid),
  index("rd_events_account_date_index").on(table.accountKey, table.eventCreatedAt),
]);

export const rdStationSyncRuns = mysqlTable("rdStationSyncRuns", {
  id: int("id").autoincrement().primaryKey(),
  accountKey: mysqlEnum("accountKey", accountKeyValues).notNull(),
  scope: mysqlEnum("scope", ["contatos", "conversoes"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const rdStationJulyLeadViews = mysqlTable("rdStationJulyLeadViews", {
  id: int("id").autoincrement().primaryKey(),
  accountKey: mysqlEnum("accountKey", accountKeyValues).notNull(),
  contactUuid: varchar("contactUuid", { length: 128 }).notNull(),
  viewType: mysqlEnum("viewType", julyViewValues).notNull(),
  contactDate: timestamp("contactDate").notNull(),
  eventTimestamp: timestamp("eventTimestamp"),
  sourceBucket: varchar("sourceBucket", { length: 48 }),
  eventIdentifier: varchar("eventIdentifier", { length: 320 }),
  eventFamily: varchar("eventFamily", { length: 64 }),
  status: mysqlEnum("status", julyLeadStatusValues).default("pendente").notNull(),
  rejectionReason: varchar("rejectionReason", { length: 160 }),
  rawEventPayload: text("rawEventPayload"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("rd_july_lead_views_account_contact_type_unique").on(table.accountKey, table.contactUuid, table.viewType),
  index("rd_july_lead_views_account_type_status_index").on(table.accountKey, table.viewType, table.status),
]);

export const bitrix24Entities = mysqlTable("bitrix24Entities", {
  id: int("id").autoincrement().primaryKey(),
  portal: varchar("portal", { length: 255 }).notNull(),
  entityType: mysqlEnum("entityType", bitrixEntityTypeValues).notNull(),
  bitrixId: int("bitrixId").notNull(),
  title: varchar("title", { length: 512 }),
  fullName: varchar("fullName", { length: 512 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 80 }),
  stageOrStatus: varchar("stageOrStatus", { length: 160 }),
  createdAtBitrix: timestamp("createdAtBitrix").notNull(),
  updatedAtBitrix: timestamp("updatedAtBitrix"),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("bitrix_entity_portal_type_id_unique").on(table.portal, table.entityType, table.bitrixId),
  index("bitrix_entity_portal_type_created_index").on(table.portal, table.entityType, table.createdAtBitrix),
]);

export const bitrix24SyncRuns = mysqlTable("bitrix24SyncRuns", {
  id: int("id").autoincrement().primaryKey(),
  portal: varchar("portal", { length: 255 }).notNull(),
  entityType: mysqlEnum("entityType", bitrixEntityTypeValues).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  importedCount: int("importedCount").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const mediaDailyPerformance = mysqlTable("mediaDailyPerformance", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", mediaPlatformValues).notNull(),
  recordLevel: mysqlEnum("recordLevel", mediaRecordLevelValues).default("campaign").notNull(),
  brand: mysqlEnum("brand", accountKeyValues).notNull(),
  reportDate: timestamp("reportDate").notNull(),
  accountId: varchar("accountId", { length: 64 }).notNull(),
  accountName: varchar("accountName", { length: 255 }),
  campaignId: varchar("campaignId", { length: 128 }).notNull(),
  campaignName: varchar("campaignName", { length: 512 }),
  adGroupId: varchar("adGroupId", { length: 128 }),
  adGroupName: varchar("adGroupName", { length: 512 }),
  adId: varchar("adId", { length: 128 }),
  adName: varchar("adName", { length: 1024 }),
  spend: double("spend").default(0).notNull(),
  impressions: int("impressions").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  platformLeads: double("platformLeads").default(0).notNull(),
  platformConversions: double("platformConversions").default(0).notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("media_daily_platform_account_date_campaign_ad_unique").on(table.platform, table.accountId, table.reportDate, table.campaignId, table.adGroupId, table.adId),
  index("media_daily_brand_date_index").on(table.brand, table.reportDate),
  index("media_daily_platform_date_index").on(table.platform, table.reportDate),
]);

export const publyaAccounts = mysqlTable("publyaAccounts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  permanentTokenCiphertext: text("permanentTokenCiphertext"),
  status: mysqlEnum("status", integrationStatusValues).default("desconectada").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastSyncAt: timestamp("lastSyncAt"),
  lastDataDate: timestamp("lastDataDate"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("publya_account_schedule_task_index").on(table.scheduleCronTaskUid),
]);

export const publyaCampaigns = mysqlTable("publyaCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignId: int("campaignId").notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  platformId: int("platformId"),
  platformName: varchar("platformName", { length: 160 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  campaignStatus: varchar("campaignStatus", { length: 64 }),
  currency: varchar("currency", { length: 8 }).default("BRL").notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_campaign_client_campaign_unique").on(table.clientId, table.campaignId),
  index("publya_campaign_client_dates_index").on(table.clientId, table.startDate, table.endDate),
]);

export const publyaCampaignDaily = mysqlTable("publyaCampaignDaily", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignId: int("campaignId").notNull(),
  reportDate: timestamp("reportDate").notNull(),
  impressions: int("impressions").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  spend: double("spend").default(0).notNull(),
  conversions: double("conversions").default(0).notNull(),
  leads: double("leads").default(0).notNull(),
  ctr: double("ctr").default(0).notNull(),
  cpm: double("cpm").default(0).notNull(),
  cpc: double("cpc").default(0).notNull(),
  viewability: double("viewability").default(0).notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_daily_client_campaign_date_unique").on(table.clientId, table.campaignId, table.reportDate),
  index("publya_daily_client_date_index").on(table.clientId, table.reportDate),
]);

export const publyaCampaignSnapshots = mysqlTable("publyaCampaignSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignId: int("campaignId").notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  impressions: int("impressions").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  spend: double("spend").default(0).notNull(),
  conversions: double("conversions").default(0).notNull(),
  leads: double("leads").default(0).notNull(),
  ctr: double("ctr").default(0).notNull(),
  cpm: double("cpm").default(0).notNull(),
  cpc: double("cpc").default(0).notNull(),
  viewability: double("viewability").default(0).notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_snapshot_client_campaign_period_unique").on(table.clientId, table.campaignId, table.periodStart, table.periodEnd),
  index("publya_snapshot_client_period_index").on(table.clientId, table.periodStart, table.periodEnd),
]);

export const publyaGroupPerformance = mysqlTable("publyaGroupPerformance", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  campaignId: int("campaignId").notNull(),
  groupType: mysqlEnum("groupType", publyaGroupTypeValues).notNull(),
  groupName: varchar("groupName", { length: 512 }).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  impressions: int("impressions").default(0).notNull(),
  reach: int("reach").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  spend: double("spend").default(0).notNull(),
  conversions: double("conversions").default(0).notNull(),
  leads: double("leads").default(0).notNull(),
  ctr: double("ctr").default(0).notNull(),
  cpm: double("cpm").default(0).notNull(),
  cpc: double("cpc").default(0).notNull(),
  viewability: double("viewability").default(0).notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_group_client_campaign_type_name_period_unique").on(table.clientId, table.campaignId, table.groupType, table.groupName, table.periodStart, table.periodEnd),
  index("publya_group_client_type_period_index").on(table.clientId, table.groupType, table.periodStart, table.periodEnd),
]);

export const publyaPushCampaigns = mysqlTable("publyaPushCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  sourceKey: varchar("sourceKey", { length: 128 }).notNull(),
  name: varchar("name", { length: 512 }).notNull(),
  mediaType: varchar("mediaType", { length: 160 }).notNull(),
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),
  contractedBudget: double("contractedBudget").default(0).notNull(),
  contractedSends: int("contractedSends").default(0).notNull(),
  reportUrl: varchar("reportUrl", { length: 1024 }).notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt"),
  lastDataDate: timestamp("lastDataDate"),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_push_campaign_client_source_unique").on(table.clientId, table.sourceKey),
  index("publya_push_campaign_dates_index").on(table.clientId, table.periodStart, table.periodEnd),
]);

export const publyaPushDaily = mysqlTable("publyaPushDaily", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  sourceKey: varchar("sourceKey", { length: 128 }).notNull(),
  reportDate: timestamp("reportDate").notNull(),
  sends: int("sends").default(0).notNull(),
  spend: double("spend").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  ctr: double("ctr").default(0).notNull(),
  cpd: double("cpd").default(0).notNull(),
  rawPayload: text("rawPayload").notNull(),
  syncedAt: timestamp("syncedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("publya_push_daily_client_source_date_unique").on(table.clientId, table.sourceKey, table.reportDate),
  index("publya_push_daily_client_date_index").on(table.clientId, table.reportDate),
]);

export const attributionAuditLinks = mysqlTable("attributionAuditLinks", {
  id: int("id").autoincrement().primaryKey(),
  brand: mysqlEnum("brand", accountKeyValues).notNull(),
  bitrixDealId: int("bitrixDealId").notNull(),
  rdContactUuid: varchar("rdContactUuid", { length: 128 }),
  rdEventUuid: varchar("rdEventUuid", { length: 160 }),
  mediaPlatform: mysqlEnum("mediaPlatform", mediaPlatformValues),
  mediaCampaignId: varchar("mediaCampaignId", { length: 128 }),
  utmSource: varchar("utmSource", { length: 160 }),
  utmCampaign: varchar("utmCampaign", { length: 512 }),
  matchStatus: mysqlEnum("matchStatus", attributionStatusValues).default("not_identified").notNull(),
  matchMethod: mysqlEnum("matchMethod", attributionMethodValues).default("none").notNull(),
  revenueValue: double("revenueValue").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("attribution_audit_brand_deal_unique").on(table.brand, table.bitrixDealId),
  index("attribution_audit_brand_status_index").on(table.brand, table.matchStatus),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type DashboardAccessLog = typeof dashboardAccessLogs.$inferSelect;
export type InsertDashboardAccessLog = typeof dashboardAccessLogs.$inferInsert;
