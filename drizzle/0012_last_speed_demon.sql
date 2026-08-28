CREATE TABLE `publyaCampaignSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`campaignId` int NOT NULL,
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
	CONSTRAINT `publyaCampaignSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `publya_snapshot_client_campaign_period_unique` UNIQUE(`clientId`,`campaignId`,`periodStart`,`periodEnd`)
);
--> statement-breakpoint
CREATE INDEX `publya_snapshot_client_period_index` ON `publyaCampaignSnapshots` (`clientId`,`periodStart`,`periodEnd`);