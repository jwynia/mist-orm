/**
 * Mist ORM - Convention-based Drizzle schema generator
 *
 * Main exports for the mist-orm package
 */

// Configuration
export * from './config/types'
export * from './config/loader'

// Parser
export * from './parser/types'
export * from './parser/parser'

// Generator
export * from './generator/analyzer'
export * from './generator/types'
export { generatePostgresSchema } from './generator/postgres'
export { generateSqliteSchema } from './generator/sqlite'
export * from './generator/writer'
export { generate, type GenerateOptions, type GenerateResult } from './generator'
export type { GeneratedSchema } from './generator/postgres' // Re-export once to avoid duplicate

// Runtime (for generated client code)
export * from './runtime/connection'
export * from './runtime/operations'

// Migrations (Phase 4 - v1.0)
export * from './migrations/types'
export {
  // Main migration workflow
  createMigration,
  getMigrationInfo,
  // Migration execution
  runMigrations,
  resetMigrations,
  getMigrationStatus,
  needsMigration,
  // Snapshot management
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  pruneSnapshots,
  hashSchemas,
  // Schema diff detection
  detectChanges,
  // Migration generation
  generateMigration,
  generateDrizzleConfig,
  listMigrationFiles,
  readMigrationFile,
} from './migrations'
