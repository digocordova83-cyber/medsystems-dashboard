CREATE TABLE `publyaAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`permanentTokenCiphertext` text,
	`status` enum('desconectada','pronta','sincronizando','erro') NOT NULL DEFAULT 'desconectada',
	`lastSyncAt` timestamp,
	`lastDataDate` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `publyaAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `publyaAccounts_clientId_unique` UNIQUE(`clientId`)
);
--> statement-breakpoint
CREATE TABLE `publyaCampaignDaily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignId` int NOT NULL,
	`reportDate` timestamp NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`spend` double NOT NULL DEFAULT 0,
	`conversions` double NOT NULL DEFAULT 0,
	`leads` double NOT NULL DEFAULT 0,
	`ctr` double NOT NULL DEFAULT 0,
	`cpm` double NOT NULL DEFAULT 0,
	`cpc` double NOT NULL DEFAULT 0,
	`viewability` double NOT NULL DEFAULT 0,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publyaCampaignDaily_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_daily_client_campaign_date_unique` UNIQUE(`clientId`,`campaignId`,`reportDate`)
);
--> statement-breakpoint
CREATE TABLE `publyaCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignId` int NOT NULL,
	`name` varchar(512) NOT NULL,
	`platformId` int,
	`platformName` varchar(160),
	`startDate` timestamp,
	`endDate` timestamp,
	`campaignStatus` varchar(64),
	`currency` varchar(8) NOT NULL DEFAULT 'BRL',
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publyaCampaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_campaign_client_campaign_unique` UNIQUE(`clientId`,`campaignId`)
);
--> statement-breakpoint
CREATE TABLE `publyaGroupPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignId` int NOT NULL,
	`groupType` enum('formats','creatives','sites','publishers','devices','cities','states','regions','channels','strategies','placements') NOT NULL,
	`groupName` varchar(512) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`impressions` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`spend` double NOT NULL DEFAULT 0,
	`conversions` double NOT NULL DEFAULT 0,
	`leads` double NOT NULL DEFAULT 0,
	`ctr` double NOT NULL DEFAULT 0,
	`cpm` double NOT NULL DEFAULT 0,
	`cpc` double NOT NULL DEFAULT 0,
	`viewability` double NOT NULL DEFAULT 0,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publyaGroupPerformance_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_group_client_campaign_type_name_period_unique` UNIQUE(`clientId`,`campaignId`,`groupType`,`groupName`,`periodStart`,`periodEnd`)
);
--> statement-breakpoint
CREATE INDEX `publya_daily_client_date_index` ON `publyaCampaignDaily` (`clientId`,`reportDate`);--> statement-breakpoint
CREATE INDEX `publya_campaign_client_dates_index` ON `publyaCampaigns` (`clientId`,`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `publya_group_client_type_period_index` ON `publyaGroupPerformance` (`clientId`,`groupType`,`periodStart`,`periodEnd`);