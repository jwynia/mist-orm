/**
 * Migration runner - applies migrations to the database
 */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import { migrate as migrateSqlite } from 'drizzle-orm/better-sqlite3/migrator'
import postgres from 'postgres'
import Database from 'better-sqlite3'
import type { ResolvedMistConfig } from '../config/types'
import type { MigrationStatus } from './types'

/**
 * Apply all pending migrations
 */
export async function runMigrations(
  config: ResolvedMistConfig
): Promise<{
  success: boolean
  applied: number
  error?: string
}> {
  const migrationsFolder = path.join(config.output, 'migrations')

  try {
    // Check if migrations folder exists
    try {
      await fs.access(migrationsFolder)
    } catch {
      return {
        success: false,
        applied: 0,
        error: 'No migrations found. Run "mist generate" first to create migrations.',
      }
    }

    if (config.database.type === 'postgres') {
      // PostgreSQL migrations
      const sql = postgres(config.connection, { max: 1 })
      const db = drizzlePostgres(sql)

      await migratePostgres(db, { migrationsFolder })

      await sql.end()

      return {
        success: true,
        applied: -1, // drizzle-orm doesn't return count
      }
    } else {
      // SQLite migrations
      const sqlite = new Database(config.connection)
      const db = drizzleSqlite(sqlite)

      await migrateSqlite(db, { migrationsFolder })

      sqlite.close()

      return {
        success: true,
        applied: -1, // drizzle-orm doesn't return count
      }
    }
  } catch (error) {
    return {
      success: false,
      applied: 0,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get migration status - which migrations are applied and which are pending
 */
export async function getMigrationStatus(
  config: ResolvedMistConfig
): Promise<MigrationStatus> {
  const migrationsFolder = path.join(config.output, 'migrations')

  try {
    // Get all migration files
    const files = await fs.readdir(migrationsFolder)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b))

    if (migrationFiles.length === 0) {
      return {
        total: 0,
        applied: [],
        pending: [],
        currentVersion: null,
        upToDate: true,
      }
    }

    // Read the migrations metadata file if it exists
    const metaPath = path.join(migrationsFolder, 'meta', '_journal.json')
    let appliedMigrations: string[] = []

    try {
      const metaContent = await fs.readFile(metaPath, 'utf-8')
      const meta = JSON.parse(metaContent)

      // The journal tracks which migrations have been applied
      // This is drizzle-kit's internal format
      if (meta.entries && Array.isArray(meta.entries)) {
        appliedMigrations = meta.entries.map((entry: any) => {
          // Extract just the migration filename from the entry
          if (typeof entry.tag === 'string') {
            return entry.tag
          }
          return null
        }).filter(Boolean)
      }
    } catch {
      // No metadata file or can't read it - assume none applied
      appliedMigrations = []
    }

    // Separate applied and pending
    const applied = migrationFiles
      .filter(f => appliedMigrations.includes(path.basename(f, '.sql')))
      .map(f => ({
        filename: f,
        appliedAt: new Date().toISOString(), // We don't track exact time
        version: path.basename(f, '.sql'),
        hash: '',
      }))

    const pending = migrationFiles.filter(
      f => !appliedMigrations.includes(path.basename(f, '.sql'))
    )

    const currentVersion = applied.length > 0
      ? applied[applied.length - 1]!.version
      : null

    return {
      total: migrationFiles.length,
      applied,
      pending,
      currentVersion,
      upToDate: pending.length === 0,
    }
  } catch (error) {
    // No migrations folder or error reading
    return {
      total: 0,
      applied: [],
      pending: [],
      currentVersion: null,
      upToDate: true,
    }
  }
}

/**
 * Check if database needs migrations
 */
export async function needsMigration(config: ResolvedMistConfig): Promise<boolean> {
  const status = await getMigrationStatus(config)
  return status.pending.length > 0
}

/**
 * Rollback the last migration (not fully supported by drizzle-orm yet)
 */
export async function rollbackMigration(
  _config: ResolvedMistConfig
): Promise<{
  success: boolean
  error?: string
}> {
  // Drizzle ORM doesn't have built-in rollback support
  // This would require custom implementation
  return {
    success: false,
    error: 'Migration rollback is not yet implemented. Drizzle ORM does not support down migrations out of the box.',
  }
}

/**
 * Reset all migrations (drop all tables and reapply)
 */
export async function resetMigrations(
  config: ResolvedMistConfig
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (config.database.type === 'postgres') {
      // PostgreSQL - drop all tables in schema
      const sql = postgres(config.connection, { max: 1 })

      await sql`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `

      await sql.end()
    } else {
      // SQLite - just delete the database file
      try {
        await fs.unlink(config.connection)
      } catch {
        // File doesn't exist, that's fine
      }
    }

    // Now run all migrations
    const result = await runMigrations(config)

    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
