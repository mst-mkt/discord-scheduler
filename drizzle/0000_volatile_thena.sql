CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guildId` text NOT NULL,
	`userId` text NOT NULL,
	`channelId` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT '[]',
	`createdAt` integer DEFAULT (current_timestamp),
	`completedAt` integer
);
