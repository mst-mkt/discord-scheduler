import type { D1Database } from '@cloudflare/workers-types'
import { type DrizzleError, type InferInsertModel, and, asc, eq, isNull } from 'drizzle-orm'
import { fromAsyncThrowable, ok } from 'neverthrow'
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
          and(
            eq(tasks.guildId, guildId),
            status === 'incomplete' ? isNull(tasks.completedAt) : undefined,
          ),
        )
        .orderBy(asc(tasks.createdAt)),
    (e) => e as DrizzleError,
  )()

  return result
}
