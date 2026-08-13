CREATE TABLE `mediaDailyPerformance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('google_ads','meta_ads') NOT NULL,
	`brand` enum('medsystems','beautysystems') NOT NULL,
	`reportDate` timestamp NOT NULL,
	`accountId` varchar(64) NOT NULL,
	`accountName` varchar(255),
	`campaignId` varchar(128) NOT NULL,
	`campaignName` varchar(512),
	`spend` double NOT NULL DEFAULT 0,
	`impressions` int NOT NULL DEFAULT 0,
	`reach` int NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`platformLeads` double NOT NULL DEFAULT 0,
	`platformConversions` double NOT NULL DEFAULT 0,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaDailyPerformance_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_daily_platform_account_date_campaign_unique` UNIQUE(`platform`,`accountId`,`reportDate`,`campaignId`)
);
--> statement-breakpoint
CREATE INDEX `media_daily_brand_date_index` ON `mediaDailyPerformance` (`brand`,`reportDate`);--> statement-breakpoint
CREATE INDEX `media_daily_platform_date_index` ON `mediaDailyPerformance` (`platform`,`reportDate`);