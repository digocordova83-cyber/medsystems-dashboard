ALTER TABLE `paidMediaReconciliationDaily` MODIFY COLUMN `ruleVersion` varchar(32) NOT NULL DEFAULT 'bitrix_unique_contact_v2';--> statement-breakpoint
ALTER TABLE `paidMediaReconciliationDaily` ADD `uniqueContacts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `paidMediaReconciliationDaily` ADD `mqlContacts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `paidMediaReconciliationDaily` ADD `sqlContacts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `paidMediaReconciliationDaily` ADD `contactsWithDeals` int DEFAULT 0 NOT NULL;