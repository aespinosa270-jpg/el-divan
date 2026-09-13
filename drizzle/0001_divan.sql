CREATE TABLE `operation_guards` (
	`id` text PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	CONSTRAINT "operation_must_be_valid" CHECK("operation_guards"."valid" = 1)
);

--> statement-breakpoint
ALTER TABLE `orders` ADD `request_key` text;
--> statement-breakpoint
ALTER TABLE `orders` ADD `reserved` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_key_unique` ON `orders` (`request_key`);
