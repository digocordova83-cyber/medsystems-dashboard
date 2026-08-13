ALTER TABLE `rdStationAccounts` ADD `contactSyncPage` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `rdStationAccounts` ADD `contactSyncTotal` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `rdStationAccounts` ADD `contactsSyncedAt` timestamp;