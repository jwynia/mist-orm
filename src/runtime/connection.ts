import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { detectDatabaseType as detectDbType } from '../config/loader.js'

export type DatabaseType = 'postgres' | 'sqlite'
export type DrizzleInstance = PostgresJsDatabase<Record<string, never>> | BetterSQLite3Database<Record<string, never>>

export interface ConnectionConfig {
  connectionString: string
  type?: DatabaseType
}

/**
 * Creates a database connection and returns a Drizzle instance
 */
export async function createConnection(config: ConnectionConfig | string): Promise<DrizzleInstance> {
  const connectionString = typeof config === 'string' ? config : config.connectionString
  const type = typeof config === 'object' && config.type ? config.type : detectDbType(connectionString)

  if (type === 'postgres') {
    return createPostgresConnection(connectionString)
  }

  if (type === 'sqlite') {
    return createSqliteConnection(connectionString)
  }

  throw new Error(`Unsupported database type: ${type}`)
}

/**
 * Creates a PostgreSQL connection using the postgres driver
 */
async function createPostgresConnection(connectionString: string): Promise<PostgresJsDatabase<Record<string, never>>> {
  try {
    // Dynamic import to avoid loading if not needed
    const postgres = await import('postgres')
    const { drizzle } = await import('drizzle-orm/postgres-js')

    const sql = postgres.default(connectionString)
    const db = drizzle(sql)

    return db
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error('PostgreSQL driver not installed. Run: npm install postgres')
    }
    throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Creates a SQLite connection using better-sqlite3 driver
 */
async function createSqliteConnection(connectionString: string): Promise<BetterSQLite3Database<Record<string, never>>> {
  try {
    // Dynamic import to avoid loading if not needed
    const Database = (await import('better-sqlite3')).default
    const { drizzle } = await import('drizzle-orm/better-sqlite3')

    // Remove sqlite:// prefix if present
    const filePath = connectionString.replace(/^sqlite:\/\//, '')

    const sqlite = new Database(filePath)
    const db = drizzle(sqlite)

    return db
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error('SQLite driver not installed. Run: npm install better-sqlite3')
    }
    throw new Error(`Failed to connect to SQLite: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Closes a database connection
 */
export async function closeConnection(_db: DrizzleInstance): Promise<void> {
  // Note: The specific close method depends on the underlying driver
  // This is a placeholder - actual implementation would need to track the underlying connection
  // For now, we'll leave this as a no-op since connections are typically closed when process exits
}
