CREATE TABLE `bill_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`name_original` text NOT NULL,
	`name_english` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`price_per_unit` real,
	`price_total` real,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subtotal` real,
	`total` real NOT NULL,
	`currency` text NOT NULL,
	`telegram_chat_id` text,
	`telegram_message_id` text,
	`created_at` integer DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `item_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_item_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`quantity` real NOT NULL,
	FOREIGN KEY (`bill_item_id`) REFERENCES `bill_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`telegram_id` text
);
