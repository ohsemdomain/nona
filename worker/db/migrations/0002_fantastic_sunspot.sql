ALTER TABLE `order` ADD `order_number` text;--> statement-breakpoint
CREATE UNIQUE INDEX `order_order_number_unique` ON `order` (`order_number`);