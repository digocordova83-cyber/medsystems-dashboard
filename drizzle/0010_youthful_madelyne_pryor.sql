CREATE TABLE `dashboardAccessLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`username` varchar(64) NOT NULL,
	`result` enum('success','failure','logout') NOT NULL,
	`ipAddress` varchar(128),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboardAccessLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `dashboard_access_created_index` ON `dashboardAccessLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `dashboard_access_username_index` ON `dashboardAccessLogs` (`username`,`createdAt`);