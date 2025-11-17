import { eq, and, type SQL } from 'drizzle-orm'
import type { DrizzleInstance } from './connection.js'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'

export type DrizzleTable = PgTable | SQLiteTable

/**
 * Inserts a new record into the database
 * @returns The inserted record with generated fields (id, timestamps, etc.)
 */
export async function insert<T extends Record<string, unknown>>(
  db: DrizzleInstance,
  table: DrizzleTable,
  data: T
): Promise<T> {
  try {
    const result = await (db as any).insert(table).values(data).returning()

    if (!result || result.length === 0) {
      throw new Error('Insert failed: no record returned')
    }

    return result[0] as T
  } catch (error) {
    if (error instanceof Error) {
      // Handle common database errors
      if (error.message.includes('unique constraint') || error.message.includes('UNIQUE constraint')) {
        throw new Error(`Unique constraint violation: ${error.message}`)
      }
      if (error.message.includes('foreign key constraint') || error.message.includes('FOREIGN KEY constraint')) {
        throw new Error(`Foreign key constraint violation: ${error.message}`)
      }
    }
    throw error
  }
}

/**
 * Finds a single record matching the where clause
 * @returns The matching record or null if not found
 */
export async function findOne<T extends Record<string, unknown>>(
  db: DrizzleInstance,
  table: DrizzleTable,
  where: Partial<T>
): Promise<T | null> {
  const whereClause = buildWhereClause(table, where)

  const result = await (db as any)
    .select()
    .from(table)
    .where(whereClause)
    .limit(1)

  if (!result || result.length === 0) {
    return null
  }

  return result[0] as T
}

/**
 * Finds all records matching the where clause
 * @returns Array of matching records (empty array if none found)
 */
export async function findMany<T extends Record<string, unknown>>(
  db: DrizzleInstance,
  table: DrizzleTable,
  where?: Partial<T>
): Promise<T[]> {
  if (!where || Object.keys(where).length === 0) {
    const result = await (db as any).select().from(table)
    return result as T[]
  }

  const whereClause = buildWhereClause(table, where)

  const result = await (db as any)
    .select()
    .from(table)
    .where(whereClause)

  return result as T[]
}

/**
 * Updates records matching the where clause
 * @returns The number of updated records
 */
export async function update<T extends Record<string, unknown>>(
  db: DrizzleInstance,
  table: DrizzleTable,
  where: Partial<T>,
  data: Partial<T>
): Promise<number> {
  try {
    const whereClause = buildWhereClause(table, where)

    // Auto-update updatedAt if it exists in the data structure
    const updateData = {
      ...data,
      // Add updatedAt timestamp if the field exists in the table
      ...(hasField(table, 'updatedAt') ? { updatedAt: new Date() } : {})
    }

    const result = await (db as any)
      .update(table)
      .set(updateData)
      .where(whereClause)

    // Extract affected rows count - this varies by driver
    // For postgres, result is typically an array
    // For sqlite, result might have a changes property
    if (Array.isArray(result)) {
      return result.length
    }
    if (typeof result === 'object' && result !== null && 'changes' in result) {
      return (result as { changes: number }).changes
    }

    // Fallback: if we can't determine the count, return 0
    return 0
  } catch (error) {
    if (error instanceof Error) {
      // Handle common database errors
      if (error.message.includes('unique constraint') || error.message.includes('UNIQUE constraint')) {
        throw new Error(`Unique constraint violation: ${error.message}`)
      }
      if (error.message.includes('foreign key constraint') || error.message.includes('FOREIGN KEY constraint')) {
        throw new Error(`Foreign key constraint violation: ${error.message}`)
      }
    }
    throw error
  }
}

/**
 * Deletes records matching the where clause
 * @returns The number of deleted records
 */
export async function deleteRecords<T extends Record<string, unknown>>(
  db: DrizzleInstance,
  table: DrizzleTable,
  where: Partial<T>
): Promise<number> {
  try {
    const whereClause = buildWhereClause(table, where)

    const result = await (db as any)
      .delete(table)
      .where(whereClause)

    // Extract affected rows count - this varies by driver
    if (Array.isArray(result)) {
      return result.length
    }
    if (typeof result === 'object' && result !== null && 'changes' in result) {
      return (result as { changes: number }).changes
    }

    return 0
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint') || error.message.includes('FOREIGN KEY constraint')) {
        throw new Error(`Cannot delete: record is referenced by other records (foreign key constraint)`)
      }
    }
    throw error
  }
}

/**
 * Builds a WHERE clause from an object of field-value pairs
 * All conditions are combined with AND
 */
function buildWhereClause<T extends Record<string, unknown>>(
  table: DrizzleTable,
  where: Partial<T>
): SQL | undefined {
  const entries = Object.entries(where)

  if (entries.length === 0) {
    return undefined
  }

  const conditions = entries.map(([key, value]) => {
    const column = (table as any)[key]
    if (!column) {
      throw new Error(`Column ${key} does not exist in table`)
    }
    return eq(column, value)
  })

  if (conditions.length === 1) {
    return conditions[0]
  }

  return and(...conditions)
}

/**
 * Checks if a table has a specific field
 */
function hasField(table: DrizzleTable, fieldName: string): boolean {
  return fieldName in table
}
