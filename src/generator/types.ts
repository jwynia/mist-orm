/**
 * Type mapping from TypeScript to Drizzle SQL types
 */

export interface ColumnDefinition {
  /**
   * Drizzle column type (e.g., 'text', 'integer', 'uuid')
   */
  drizzleType: string

  /**
   * Import name for the type (e.g., 'text', 'pgTable')
   */
  importName: string

  /**
   * Whether the column should be NOT NULL
   */
  notNull: boolean

  /**
   * Whether this is an array type
   */
  isArray: boolean

  /**
   * Additional modifiers to apply (e.g., 'defaultNow()', 'unique()')
   */
  modifiers?: string[]

  /**
   * Comment to add to column (for documentation)
   */
  comment?: string

  /**
   * Whether this type mapping needs manual review
   */
  needsManualReview?: boolean
}

/**
 * Maps a TypeScript type to a Drizzle column definition
 */
export function mapTypeToColumn(
  tsType: string,
  database: 'postgres' | 'sqlite',
  isOptional: boolean
): ColumnDefinition {
  const notNull = !isOptional

  // Handle array types
  if (tsType.endsWith('[]')) {
    const elementType = tsType.slice(0, -2)
    return mapArrayType(elementType, database, notNull)
  }

  // Handle Record types
  if (tsType.startsWith('Record<')) {
    return mapRecordType(database, notNull)
  }

  // Handle primitive types
  switch (tsType) {
    case 'string':
      return {
        drizzleType: 'text',
        importName: 'text',
        notNull,
        isArray: false,
      }

    case 'number':
      return {
        drizzleType: 'integer',
        importName: 'integer',
        notNull,
        isArray: false,
      }

    case 'boolean':
      if (database === 'postgres') {
        return {
          drizzleType: 'boolean',
          importName: 'boolean',
          notNull,
          isArray: false,
        }
      } else {
        // SQLite stores booleans as 0/1
        return {
          drizzleType: 'integer',
          importName: 'integer',
          notNull,
          isArray: false,
          comment: 'boolean stored as 0/1',
        }
      }

    case 'Date':
      if (database === 'postgres') {
        return {
          drizzleType: 'timestamp',
          importName: 'timestamp',
          notNull,
          isArray: false,
        }
      } else {
        // SQLite stores dates as unix timestamps
        return {
          drizzleType: 'integer',
          importName: 'integer',
          notNull,
          isArray: false,
          comment: 'timestamp stored as unix time',
        }
      }

    default:
      // Unknown type - default to text with a warning
      return {
        drizzleType: 'text',
        importName: 'text',
        notNull,
        isArray: false,
        needsManualReview: true,
        comment: `Unknown type: ${tsType}, defaulted to text`,
      }
  }
}

/**
 * Maps array types
 */
function mapArrayType(
  elementType: string,
  database: 'postgres' | 'sqlite',
  notNull: boolean
): ColumnDefinition {
  if (database === 'postgres') {
    // PostgreSQL supports native arrays
    const baseType = mapTypeToColumn(elementType, database, false)
    return {
      drizzleType: baseType.drizzleType,
      importName: baseType.importName,
      notNull,
      isArray: true,
    }
  } else {
    // SQLite doesn't support arrays, use JSON serialization
    return {
      drizzleType: 'text',
      importName: 'text',
      notNull,
      isArray: false,
      comment: `${elementType}[] stored as JSON`,
    }
  }
}

/**
 * Maps Record types
 */
function mapRecordType(
  database: 'postgres' | 'sqlite',
  notNull: boolean
): ColumnDefinition {
  if (database === 'postgres') {
    return {
      drizzleType: 'jsonb',
      importName: 'jsonb',
      notNull,
      isArray: false,
    }
  } else {
    return {
      drizzleType: 'text',
      importName: 'text',
      notNull,
      isArray: false,
      comment: 'Record stored as JSON',
    }
  }
}
