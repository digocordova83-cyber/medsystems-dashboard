CREATE TABLE `rdStationJulyLeadViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`contactUuid` varchar(128) NOT NULL,
	`viewType` enum('primeira','ultima') NOT NULL,
	`contactDate` timestamp NOT NULL,
	`eventTimestamp` timestamp,
	`sourceBucket` varchar(48),
	`eventIdentifier` varchar(320),
	`eventFamily` varchar(64),
	`status` enum('pendente','qualificado','rejeitado') NOT NULL DEFAULT 'pendente',
	`rejectionReason` varchar(160),
	`rawEventPayload` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdStationJulyLeadViews_id` PRIMARY KEY(`id`),
	CONSTRAINT `rd_july_lead_views_account_contact_type_unique` UNIQUE(`accountKey`,`contactUuid`,`viewType`)
);
--> statement-breakpoint
CREATE INDEX `rd_july_lead_views_account_type_status_index` ON `rdStationJulyLeadViews` (`accountKey`,`viewType`,`status`);