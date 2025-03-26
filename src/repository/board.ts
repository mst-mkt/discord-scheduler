import type { D1Database } from '@cloudflare/workers-types'
import { type DrizzleError, type InferInsertModel, and, eq } from 'drizzle-orm'
import { fromAsyncThrowable, ok } from 'neverthrow'
import { createDbClient } from '../db/client'
import { boardMessages } from '../db/schema'

export const createBoardMessage = async (
  db: D1Database,
  message: InferInsertModel<typeof boardMessages>,
) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () => dbClient.insert(boardMessages).values(message).returning(),
    (e) => e as DrizzleError,
  )().andThen(([message]) => ok(message))

  return result
}

export const getBoardMessages = async (
  db: D1Database,
  guildId: string,
  type: 'task' | 'schedule',
) => {
  const dbClient = createDbClient(db)
  const result = await fromAsyncThrowable(
    () =>
      dbClient
        .select()
        .from(boardMessages)
        .where(and(eq(boardMessages.guildId, guildId), eq(boardMessages.type, type))),
    (e) => e as DrizzleError,
  )()

  return result
}
