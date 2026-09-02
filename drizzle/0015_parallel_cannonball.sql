CREATE TABLE `leadReferenceBenchmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessDate` varchar(10) NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`sourceLabel` varchar(160) NOT NULL,
	`reportedLeads` int NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadReferenceBenchmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_reference_benchmark_unique` UNIQUE(`businessDate`,`accountKey`,`sourceLabel`)
);
--> statement-breakpoint
CREATE TABLE `leadReferenceEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('supabase_export') NOT NULL DEFAULT 'supabase_export',
	`sourceRecordHash` varchar(64) NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`sourceClientSlug` varchar(128) NOT NULL,
	`convertedAt` timestamp NOT NULL,
	`identityHash` varchar(64) NOT NULL,
	`emailHash` varchar(64),
	`phoneHash` varchar(64),
	`channel` enum('meta_ads','google_ads','unknown') NOT NULL DEFAULT 'unknown',
	`utmSource` varchar(160),
	`utmCampaign` varchar(512),
	`conversionEvent` varchar(512),
	`rdContactUuid` varchar(128),
	`rdMatchMethod` varchar(32),
	`rdEventConfirmed` int NOT NULL DEFAULT 0,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leadReferenceEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_reference_source_record_unique` UNIQUE(`source`,`sourceRecordHash`)
);
--> statement-breakpoint
CREATE INDEX `lead_reference_benchmark_date_index` ON `leadReferenceBenchmarks` (`businessDate`);--> statement-breakpoint
CREATE INDEX `lead_reference_date_brand_index` ON `leadReferenceEvents` (`convertedAt`,`accountKey`);--> statement-breakpoint
CREATE INDEX `lead_reference_channel_date_index` ON `leadReferenceEvents` (`channel`,`convertedAt`);--> statement-breakpoint
CREATE INDEX `lead_reference_identity_index` ON `leadReferenceEvents` (`accountKey`,`identityHash`);