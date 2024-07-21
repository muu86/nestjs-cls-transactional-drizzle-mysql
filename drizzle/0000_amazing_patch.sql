CREATE TABLE `accounts` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int unsigned,
	`name` text,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
