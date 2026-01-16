CREATE TABLE `app_setting` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `app_setting_key_unique` ON `app_setting` (`key`);--> statement-breakpoint
CREATE TABLE `public_link` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`link_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_link_link_id_unique` ON `public_link` (`link_id`);--> statement-breakpoint
CREATE INDEX `public_link_link_id_idx` ON `public_link` (`link_id`);--> statement-breakpoint
CREATE INDEX `public_link_resource_idx` ON `public_link` (`resource_type`,`resource_id`);