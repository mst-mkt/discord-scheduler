import type { D1Database } from '@cloudflare/workers-types'
import type { DrizzleError, InferInsertModel } from 'drizzle-orm'
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
