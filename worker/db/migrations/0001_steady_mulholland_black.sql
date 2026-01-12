-- Add resource column as nullable first
ALTER TABLE `permission` ADD `resource` text;--> statement-breakpoint
-- Add action column as nullable first
ALTER TABLE `permission` ADD `action` text;--> statement-breakpoint
-- Populate resource from existing name (part before colon)
UPDATE `permission` SET `resource` = substr(`name`, 1, instr(`name`, ':') - 1);--> statement-breakpoint
-- Populate action from existing name (part after colon)
UPDATE `permission` SET `action` = substr(`name`, instr(`name`, ':') + 1);--> statement-breakpoint
-- Note: SQLite doesn't support ALTER COLUMN to add NOT NULL constraint
-- The schema defines these as NOT NULL, which will be enforced on new inserts
