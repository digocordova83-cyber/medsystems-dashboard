ALTER TABLE `publyaAccounts` ADD `scheduleCronTaskUid` varchar(65);--> statement-breakpoint
CREATE INDEX `publya_account_schedule_task_index` ON `publyaAccounts` (`scheduleCronTaskUid`);