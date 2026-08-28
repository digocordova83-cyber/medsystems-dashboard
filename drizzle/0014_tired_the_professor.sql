CREATE TABLE `publyaPushCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`sourceKey` varchar(128) NOT NULL,
	`name` varchar(512) NOT NULL,
	`mediaType` varchar(160) NOT NULL,
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`contractedBudget` double NOT NULL DEFAULT 0,
	`contractedSends` int NOT NULL DEFAULT 0,
	`reportUrl` varchar(1024) NOT NULL,
	`sourceUpdatedAt` timestamp,
	`lastDataDate` timestamp,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publyaPushCampaigns_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_push_campaign_client_source_unique` UNIQUE(`clientId`,`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `publyaPushDaily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`sourceKey` varchar(128) NOT NULL,
	`reportDate` timestamp NOT NULL,
	`sends` int NOT NULL DEFAULT 0,
	`spend` double NOT NULL DEFAULT 0,
	`clicks` int NOT NULL DEFAULT 0,
	`ctr` double NOT NULL DEFAULT 0,
	`cpd` double NOT NULL DEFAULT 0,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `publyaPushDaily_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_push_daily_client_source_date_unique` UNIQUE(`clientId`,`sourceKey`,`reportDate`)
);
--> statement-breakpoint
CREATE INDEX `publya_push_campaign_dates_index` ON `publyaPushCampaigns` (`clientId`,`periodStart`,`periodEnd`);--> statement-breakpoint
CREATE INDEX `publya_push_daily_client_date_index` ON `publyaPushDaily` (`clientId`,`reportDate`);