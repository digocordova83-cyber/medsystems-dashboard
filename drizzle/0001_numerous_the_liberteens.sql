CREATE TABLE `rdStationAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`status` enum('desconectada','pronta','sincronizando','erro') NOT NULL DEFAULT 'desconectada',
	`segmentationId` varchar(128),
	`oauthStateHash` varchar(128),
	`oauthStateExpiresAt` timestamp,
	`accessTokenCiphertext` text,
	`refreshTokenCiphertext` text,
	`tokenExpiresAt` timestamp,
	`authorizedAt` timestamp,
	`lastSyncAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdStationAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rdStationAccounts_accountKey_unique` UNIQUE(`accountKey`)
);
--> statement-breakpoint
CREATE TABLE `rdStationContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`contactUuid` varchar(128) NOT NULL,
	`name` varchar(320),
	`email` varchar(320),
	`phone` varchar(80),
	`createdAtRd` timestamp,
	`lastConversionAt` timestamp,
	`eventsSyncedAt` timestamp,
	`rawPayload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rdStationContacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `rd_contacts_account_uuid_unique` UNIQUE(`accountKey`,`contactUuid`)
);
--> statement-breakpoint
CREATE TABLE `rdStationConversionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`contactUuid` varchar(128) NOT NULL,
	`eventUuid` varchar(160) NOT NULL,
	`eventType` varchar(64),
	`eventFamily` varchar(64),
	`eventIdentifier` varchar(320),
	`eventCreatedAt` timestamp NOT NULL,
	`rawPayload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdStationConversionEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `rd_events_account_event_unique` UNIQUE(`accountKey`,`eventUuid`)
);
--> statement-breakpoint
CREATE TABLE `rdStationSyncRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`scope` enum('contatos','conversoes') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rdStationSyncRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `rd_contacts_account_events_index` ON `rdStationContacts` (`accountKey`,`eventsSyncedAt`);--> statement-breakpoint
CREATE INDEX `rd_events_account_date_index` ON `rdStationConversionEvents` (`accountKey`,`eventCreatedAt`);