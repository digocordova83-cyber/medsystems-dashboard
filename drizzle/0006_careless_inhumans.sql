ALTER TABLE `mediaDailyPerformance` DROP INDEX `media_daily_platform_account_date_campaign_unique`;--> statement-breakpoint
ALTER TABLE `mediaDailyPerformance` ADD `adGroupId` varchar(128);--> statement-breakpoint
ALTER TABLE `mediaDailyPerformance` ADD `adGroupName` varchar(512);--> statement-breakpoint
ALTER TABLE `mediaDailyPerformance` ADD `adId` varchar(128);--> statement-breakpoint
ALTER TABLE `mediaDailyPerformance` ADD `adName` varchar(1024);--> statement-breakpoint
ALTER TABLE `mediaDailyPerformance` ADD CONSTRAINT `media_daily_platform_account_date_campaign_ad_unique` UNIQUE(`platform`,`accountId`,`reportDate`,`campaignId`,`adGroupId`,`adId`);