CREATE TABLE `bitrix24Entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portal` varchar(255) NOT NULL,
	`entityType` enum('lead','contact','deal') NOT NULL,
	`bitrixId` int NOT NULL,
	`title` varchar(512),
	`fullName` varchar(512),
	`email` varchar(320),
	`phone` varchar(80),
	`stageOrStatus` varchar(160),
	`createdAtBitrix` timestamp NOT NULL,
	`updatedAtBitrix` timestamp,
	`rawPayload` text NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bitrix24Entities_id` PRIMARY KEY(`id`),
	CONSTRAINT `bitrix_entity_portal_type_id_unique` UNIQUE(`portal`,`entityType`,`bitrixId`)
);
--> statement-breakpoint
CREATE TABLE `bitrix24SyncRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portal` varchar(255) NOT NULL,
	`entityType` enum('lead','contact','deal') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`importedCount` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bitrix24SyncRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `bitrix_entity_portal_type_created_index` ON `bitrix24Entities` (`portal`,`entityType`,`createdAtBitrix`);