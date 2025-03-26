import { sql } from 'drizzle-orm'
import { sqliteTable } from 'drizzle-orm/sqlite-core'

export const tasks = sqliteTable('tasks', (d) => ({
  id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  guildId: d.text({ mode: 'text' }).notNull(),
  userId: d.text({ mode: 'text' }).notNull(),
  channelId: d.text({ mode: 'text' }).notNull(),

  content: d.text({ mode: 'text' }).notNull(),
  category: d.text({ mode: 'json' }).$type<string[]>().default([]),

  createdAt: d.integer({ mode: 'timestamp_ms' }).default(sql`(current_timestamp)`),
  completedAt: d.integer({ mode: 'timestamp_ms' }),
}))

export const schedules = sqliteTable('schedules', (d) => ({
  id: d.integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  guildId: d.text({ mode: 'text' }).notNull(),
  userId: d.text({ mode: 'text' }).notNull(),
  channelId: d.text({ mode: 'text' }).notNull(),

  content: d.text({ mode: 'text' }).notNull(),
  category: d.text({ mode: 'json' }).$type<string[]>().default([]),

  date: d.text({ mode: 'text' }).notNull(),
  time: d.text({ mode: 'text' }),

  dateTime: d.integer({ mode: 'timestamp_ms' }).notNull(),

  createdAt: d.integer({ mode: 'timestamp_ms' }).default(sql`(current_timestamp)`),
}))

export const boardMessages = sqliteTable('board_messages', (d) => ({
  guildId: d.text({ mode: 'text' }).notNull(),
  channelId: d.text({ mode: 'text' }).notNull(),
  messageId: d.text({ mode: 'text' }).notNull(),
  type: d.text({ mode: 'text' }).$type<'task' | 'schedule'>().notNull(),
}))
