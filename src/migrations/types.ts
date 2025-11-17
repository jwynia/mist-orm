/**
 * Types for migration system
 */

import type { AnalyzedInterface } from '../generator/analyzer'

/**
 * Schema snapshot - captures the state of all schemas at a point in time
 */
export interface SchemaSnapshot {
  /**
   * Timestamp when snapshot was created
   */
  timestamp: string

  /**
   * Version identifier (ISO date string)
   */
  version: string

  /**
   * Database type
   */
  databaseType: 'postgres' | 'sqlite'

  /**
   * All analyzed interfaces at this point in time
   */
  schemas: AnalyzedInterface[]

  /**
   * Hash of the schemas for quick comparison
   */
  hash: string
}

/**
 * Types of schema changes that can be detected
 */
export type SchemaChangeType =
  | 'table_added'
  | 'table_removed'
  | 'column_added'
  | 'column_removed'
  | 'column_type_changed'
  | 'column_nullable_changed'
  | 'primary_key_changed'
  | 'foreign_key_added'
  | 'foreign_key_removed'
  | 'unique_constraint_added'
  | 'unique_constraint_removed'

/**
 * Represents a detected schema change
 */
export interface SchemaChange {
  /**
   * Type of change
   */
  type: SchemaChangeType

  /**
   * Table affected by the change
   */
  table: string

  /**
   * Column affected (if applicable)
   */
  column?: string

  /**
   * Description of the change
   */
  description: string

  /**
   * Whether this change is potentially destructive (data loss)
   */
  destructive: boolean

  /**
   * Old value (for changes)
   */
  oldValue?: any

  /**
   * New value (for changes)
   */
  newValue?: any
}

/**
 * Result of comparing two snapshots
 */
export interface SchemaDiff {
  /**
   * Whether any changes were detected
   */
  hasChanges: boolean

  /**
   * List of all detected changes
   */
  changes: SchemaChange[]

  /**
   * Previous snapshot
   */
  previousSnapshot: SchemaSnapshot | null

  /**
   * Current schemas
   */
  currentSchemas: AnalyzedInterface[]

  /**
   * Whether any destructive changes were detected
   */
  hasDestructiveChanges: boolean
}

/**
 * Migration tracking record
 */
export interface MigrationRecord {
  /**
   * Migration filename (e.g., "0001_initial.sql")
   */
  filename: string

  /**
   * When the migration was applied
   */
  appliedAt: string

  /**
   * Version/timestamp from snapshot
   */
  version: string

  /**
   * Hash of the migration content
   */
  hash: string
}

/**
 * Migration status information
 */
export interface MigrationStatus {
  /**
   * Total migrations available
   */
  total: number

  /**
   * Migrations that have been applied
   */
  applied: MigrationRecord[]

  /**
   * Migrations that are pending
   */
  pending: string[]

  /**
   * Current schema version
   */
  currentVersion: string | null

  /**
   * Whether the database is up to date
   */
  upToDate: boolean
}
