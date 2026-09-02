CREATE TABLE `paidMediaReconciliationDaily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessDate` varchar(10) NOT NULL,
	`accountKey` enum('medsystems','beautysystems') NOT NULL,
	`uniqueBitrixLeadIds` int NOT NULL DEFAULT 0,
	`mqlLeadIds` int NOT NULL DEFAULT 0,
	`sqlLeadIds` int NOT NULL DEFAULT 0,
	`leadIdsWithDeals` int NOT NULL DEFAULT 0,
	`reconciledByIdentity` int NOT NULL DEFAULT 0,
	`recoveredOutsidePaidField` int NOT NULL DEFAULT 0,
	`peopleWithMultipleLeadIds` int NOT NULL DEFAULT 0,
	`leadIdsInDuplicateGroups` int NOT NULL DEFAULT 0,
	`extraLeadIds` int NOT NULL DEFAULT 0,
	`ruleVersion` varchar(32) NOT NULL DEFAULT 'bitrix_lead_id_v1',
	`status` varchar(32) NOT NULL DEFAULT 'completed',
	`summary` text NOT NULL,
	`reconciledAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paidMediaReconciliationDaily_id` PRIMARY KEY(`id`),
	CONSTRAINT `paid_media_reconciliation_date_brand_unique` UNIQUE(`businessDate`,`accountKey`)
);
--> statement-breakpoint
CREATE TABLE `paidMediaReconciliationJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobKey` varchar(64) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paidMediaReconciliationJobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `paid_media_reconciliation_job_key_unique` UNIQUE(`jobKey`)
);
--> statement-breakpoint
CREATE INDEX `paid_media_reconciliation_date_index` ON `paidMediaReconciliationDaily` (`businessDate`);--> statement-breakpoint
CREATE INDEX `paid_media_reconciliation_task_uid_index` ON `paidMediaReconciliationJobs` (`scheduleCronTaskUid`);