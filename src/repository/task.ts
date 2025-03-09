import type { D1Database } from '@cloudflare/workers-types'
import { type DrizzleError, type InferInsertModel, and, desc, eq, isNull } from 'drizzle-orm'
import { fromAsyncThrowable, ok } from 'neverthrow'
import { match } from 'ts-pattern'
import { createDbClient } from '../db/client'
import { tasks } from '../db/schema'

export const createTask = async (db: D1Database, task: InferInsertModel<typeof tasks>) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () => dbClient.insert(tasks).values(task).returning(),
    (e) => e as DrizzleError,
  )().andThen(([task]) => ok(task))

  return result
}

export const getTasks = async (
  db: D1Database,
  guildId: string,
  status: 'all' | 'incomplete' = 'incomplete',
) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .select()
        .from(tasks)
        .where(
          match(status)
            .with('all', () => eq(tasks.guildId, guildId))
            .with('incomplete', () => and(eq(tasks.guildId, guildId), isNull(tasks.completedAt)))
            .exhaustive(),
        )
        .orderBy(desc(tasks.createdAt)),
    (e) => e as DrizzleError,
  )()

  return result
}

export const deleteTask = async (db: D1Database, guildId: string, id: number) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .delete(tasks)
        .where(and(eq(tasks.id, id), eq(tasks.guildId, guildId)))
        .returning(),
    (e) => e as DrizzleError,
  )()

  return result
}

export const completeTask = async (db: D1Database, guildId: string, id: number) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .update(tasks)
        .set({ completedAt: new Date() })
        .where(and(eq(tasks.id, id), eq(tasks.guildId, guildId)))
        .returning(),
    (e) => e as DrizzleError,
  )()

  return result
}
