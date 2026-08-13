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

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

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
