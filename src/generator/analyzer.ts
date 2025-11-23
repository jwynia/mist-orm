/**
 * Convention detection and interface analysis
 */

import type { ParsedInterface } from '../parser/types'
import type { ResolvedMistConfig } from '../config/types'

export interface PrimaryKeyInfo {
  field: string
  type: 'uuid' | 'serial' | 'text'
}

export interface ForeignKeyInfo {
  field: string
  referencesTable: string
  referencesField: string
}

export interface TimestampInfo {
  createdAt: string
  updatedAt: string
}

export interface AnalyzedInterface {
  /**
   * Original parsed interface
   */
  interface: ParsedInterface

  /**
   * Table name (derived from interface name)
   */
  tableName: string

  /**
   * Primary key information (always present - auto-generated if not in interface)
   */
  primaryKey: PrimaryKeyInfo

  /**
   * Foreign key relationships
   */
  foreignKeys: ForeignKeyInfo[]

  /**
   * Fields that should be unique
   */
  uniqueFields: string[]

  /**
   * Timestamp configuration
   */
  timestamps: TimestampInfo | null
}

/**
 * Detects the primary key field and type
 *
 * Auto-generates a primary key if not present in the interface:
 * - PostgreSQL: uuid with defaultRandom()
 * - SQLite: integer with auto-increment
 */
export function detectPrimaryKey(
  iface: ParsedInterface,
  config: ResolvedMistConfig
): PrimaryKeyInfo {
  const pkFieldName = config.conventions.primaryKey
  const pkField = iface.properties.find(p => p.name === pkFieldName)

  // Determine type based on user's field type OR auto-generate based on DB type
  let type: 'uuid' | 'serial' | 'text'

  if (pkField) {
    // User defined primary key field - use their type
    if (pkField.type === 'string') {
      type = 'uuid' // Default string IDs to UUID
    } else if (pkField.type === 'number') {
      type = 'serial' // Auto-incrementing integer
    } else {
      type = 'text' // Fallback
    }
  } else {
    // Auto-generate primary key based on database type
    if (config.database.type === 'postgres') {
      type = 'uuid' // PostgreSQL: use UUID with defaultRandom()
    } else {
      type = 'serial' // SQLite: use auto-increment integer
    }
  }

  return {
    field: pkFieldName,
    type,
  }
}

/**
 * Detects foreign key relationships based on naming conventions
 */
export function detectForeignKeys(
  iface: ParsedInterface,
  config: ResolvedMistConfig
): ForeignKeyInfo[] {
  const foreignKeys: ForeignKeyInfo[] = []
  const pkFieldName = config.conventions.primaryKey

  for (const prop of iface.properties) {
    // Skip primary key field
    if (prop.name === pkFieldName) {
      continue
    }

    // Check for @noForeignKey JSDoc tag - allows opting out of FK generation
    if (prop.jsDocTags.noForeignKey !== undefined) {
      continue
    }

    // Check for explicit mapping in config
    const explicitMapping = config.conventions.foreignKeys[prop.name]
    if (explicitMapping !== undefined) {
      // Check if explicitly disabled with false
      if (explicitMapping === false) {
        continue
      }

      // Otherwise it's a string mapping to a specific table
      foreignKeys.push({
        field: prop.name,
        referencesTable: explicitMapping,
        referencesField: 'id', // Assume 'id' for now
      })
      continue
    }

    // Auto-detect pattern: {tableName}Id
    if (prop.name.endsWith('Id')) {
      const tableName = prop.name.slice(0, -2) // Remove 'Id'
      // Convert camelCase to plural lowercase
      // e.g., user -> users, post -> posts
      const pluralTableName = pluralize(tableName.toLowerCase())

      foreignKeys.push({
        field: prop.name,
        referencesTable: pluralTableName,
        referencesField: 'id',
      })
    }
  }

  return foreignKeys
}

/**
 * Simple pluralization (just adds 's' for now)
 */
function pluralize(word: string): string {
  // Simple implementation - just add 's'
  // TODO: Handle irregular plurals if needed
  return word + 's'
}

/**
 * Detects timestamp configuration
 */
export function detectTimestamps(config: ResolvedMistConfig): TimestampInfo | null {
  if (!config.conventions.timestamps) {
    return null
  }

  return {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
}

/**
 * Detects unique constraints from JSDoc tags and config
 */
export function detectUniqueConstraints(
  iface: ParsedInterface,
  config: ResolvedMistConfig
): string[] {
  const uniqueFields = new Set<string>()

  // Check JSDoc tags for @unique
  for (const prop of iface.properties) {
    if (prop.jsDocTags.unique !== undefined) {
      uniqueFields.add(prop.name)
    }
  }

  // Check config for unique constraints
  const configUnique = config.conventions.unique[iface.name]
  if (configUnique) {
    for (const field of configUnique) {
      uniqueFields.add(field)
    }
  }

  return Array.from(uniqueFields)
}

/**
 * Converts interface name to table name
 */
export function interfaceNameToTableName(interfaceName: string): string {
  // Convert to lowercase and pluralize
  return pluralize(interfaceName.toLowerCase())
}

/**
 * Performs complete analysis of an interface
 */
export function analyzeInterface(
  iface: ParsedInterface,
  config: ResolvedMistConfig
): AnalyzedInterface {
  return {
    interface: iface,
    tableName: interfaceNameToTableName(iface.name),
    primaryKey: detectPrimaryKey(iface, config),
    foreignKeys: detectForeignKeys(iface, config),
    uniqueFields: detectUniqueConstraints(iface, config),
    timestamps: detectTimestamps(config),
  }
}
