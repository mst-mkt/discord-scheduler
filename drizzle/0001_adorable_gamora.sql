CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guildId` text NOT NULL,
	`userId` text NOT NULL,
	`channelId` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT '[]',
	`date` text NOT NULL,
	`time` text,
	`createdAt` integer DEFAULT (current_timestamp)
);
