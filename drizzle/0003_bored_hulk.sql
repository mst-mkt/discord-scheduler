PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guildId` text NOT NULL,
	`userId` text NOT NULL,
	`channelId` text NOT NULL,
	`content` text NOT NULL,
	`category` text DEFAULT '[]',
	`date` text NOT NULL,
	`time` text,
	`dateTime` integer NOT NULL,
	`createdAt` integer DEFAULT (current_timestamp)
);
--> statement-breakpoint
INSERT INTO `__new_schedules`("id", "guildId", "userId", "channelId", "content", "category", "date", "time", "dateTime", "createdAt") SELECT "id", "guildId", "userId", "channelId", "content", "category", "date", "time", "dateTime", "createdAt" FROM `schedules`;--> statement-breakpoint
DROP TABLE `schedules`;--> statement-breakpoint
ALTER TABLE `__new_schedules` RENAME TO `schedules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;