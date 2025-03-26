import type { D1Database } from '@cloudflare/workers-types'
import { type DrizzleError, type InferInsertModel, and, asc, eq, isNull } from 'drizzle-orm'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { fromAsyncThrowable, ok } from 'neverthrow'
import { createDbClient } from '../db/client'
import { schedules } from '../db/schema'
import { generateDataTime } from '../utils/datetime'

const insertDataTime = async (dbClient: DrizzleD1Database) => {
  const datetimeEmptyRecords = await dbClient
    .select()
    .from(schedules)
    .where(isNull(schedules.dateTime))
  if (datetimeEmptyRecords.length === 0) return

  const dateTimes = datetimeEmptyRecords.map((record) =>
    generateDataTime(record.date, record.time ?? undefined),
  )

  await Promise.all(
    datetimeEmptyRecords.map((record, index) =>
      dbClient
        .update(schedules)
        .set({ dateTime: dateTimes[index] })
        .where(eq(schedules.id, record.id)),
    ),
  )
}

export const createSchedule = async (
  db: D1Database,
  schedule: InferInsertModel<typeof schedules>,
) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () => dbClient.insert(schedules).values(schedule).returning(),
    (e) => e as DrizzleError,
  )().andThen(([schedule]) => ok(schedule))

  return result
}

export const getSchedules = async (db: D1Database, guildId: string) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .select()
        .from(schedules)
        .where(eq(schedules.guildId, guildId))
        .orderBy(asc(schedules.createdAt)),
    (e) => e as DrizzleError,
  )()

  insertDataTime(dbClient)

  return result
}

export const getTodaySchedules = async (db: D1Database, date: string) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .select()
        .from(schedules)
        .where(eq(schedules.date, date))
        .orderBy(asc(schedules.createdAt)),
    (e) => e as DrizzleError,
  )()

  return result
}

export const deleteSchedule = async (db: D1Database, guildId: string, id: number) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .delete(schedules)
        .where(and(eq(schedules.id, id), eq(schedules.guildId, guildId)))
        .returning(),
    (e) => e as DrizzleError,
  )().andThen(([schedule]) => ok(schedule))

  return result
}
