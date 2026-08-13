CREATE TABLE `attributionAuditLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brand` enum('medsystems','beautysystems') NOT NULL,
	`bitrixDealId` int NOT NULL,
	`rdContactUuid` varchar(128),
	`mediaPlatform` enum('google_ads','meta_ads'),
	`mediaCampaignId` varchar(128),
	`utmSource` varchar(160),
	`utmCampaign` varchar(512),
	`matchStatus` enum('not_identified','channel_signal','identified') NOT NULL DEFAULT 'not_identified',
	`matchMethod` enum('none','utm_source','utm_campaign','identifier') NOT NULL DEFAULT 'none',
	`revenueValue` double NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attributionAuditLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `attribution_audit_brand_deal_unique` UNIQUE(`brand`,`bitrixDealId`)
);
--> statement-breakpoint
CREATE INDEX `attribution_audit_brand_status_index` ON `attributionAuditLinks` (`brand`,`matchStatus`);