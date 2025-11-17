/**
 * Schema diff detection - compares schemas to detect changes
 */

import type { AnalyzedInterface } from '../generator/analyzer'
import type { SchemaSnapshot, SchemaDiff, SchemaChange } from './types'

/**
 * Compare two schemas and detect changes
 */
export function detectChanges(
  previousSnapshot: SchemaSnapshot | null,
  currentSchemas: AnalyzedInterface[]
): SchemaDiff {
  const changes: SchemaChange[] = []

  // If no previous snapshot, this is the initial migration
  if (!previousSnapshot) {
    // All tables are being added
    for (const schema of currentSchemas) {
      changes.push({
        type: 'table_added',
        table: schema.tableName,
        description: `Added table '${schema.tableName}'`,
        destructive: false,
      })
    }

    return {
      hasChanges: changes.length > 0,
      changes,
      previousSnapshot: null,
      currentSchemas,
      hasDestructiveChanges: false,
    }
  }

  const previousSchemas = previousSnapshot.schemas
  const previousTableMap = new Map(previousSchemas.map(s => [s.tableName, s]))
  const currentTableMap = new Map(currentSchemas.map(s => [s.tableName, s]))

  // Detect removed tables
  for (const [tableName, _schema] of previousTableMap) {
    if (!currentTableMap.has(tableName)) {
      changes.push({
        type: 'table_removed',
        table: tableName,
        description: `Removed table '${tableName}'`,
        destructive: true,
      })
    }
  }

  // Detect added tables and column changes
  for (const [tableName, currentSchema] of currentTableMap) {
    const previousSchema = previousTableMap.get(tableName)

    if (!previousSchema) {
      // New table
      changes.push({
        type: 'table_added',
        table: tableName,
        description: `Added table '${tableName}'`,
        destructive: false,
      })
      continue
    }

    // Compare columns
    const columnChanges = compareColumns(previousSchema, currentSchema)
    changes.push(...columnChanges)

    // Compare primary keys
    const pkChanges = comparePrimaryKeys(previousSchema, currentSchema)
    changes.push(...pkChanges)

    // Compare foreign keys
    const fkChanges = compareForeignKeys(previousSchema, currentSchema)
    changes.push(...fkChanges)

    // Compare unique constraints
    const uniqueChanges = compareUniqueConstraints(previousSchema, currentSchema)
    changes.push(...uniqueChanges)
  }

  const hasDestructiveChanges = changes.some(c => c.destructive)

  return {
    hasChanges: changes.length > 0,
    changes,
    previousSnapshot,
    currentSchemas,
    hasDestructiveChanges,
  }
}

/**
 * Compare columns between two schemas
 */
function compareColumns(
  previousSchema: AnalyzedInterface,
  currentSchema: AnalyzedInterface
): SchemaChange[] {
  const changes: SchemaChange[] = []
  const tableName = currentSchema.tableName

  // Build maps of properties
  const previousProps = new Map(
    previousSchema.interface.properties.map(p => [p.name, p])
  )
  const currentProps = new Map(
    currentSchema.interface.properties.map(p => [p.name, p])
  )

  // Also include generated fields (id, createdAt, updatedAt)
  const allPreviousFields = new Set([
    ...previousProps.keys(),
    ...(previousSchema.primaryKey ? [previousSchema.primaryKey.field] : []),
    ...(previousSchema.timestamps ? ['createdAt', 'updatedAt'] : []),
  ])

  const allCurrentFields = new Set([
    ...currentProps.keys(),
    ...(currentSchema.primaryKey ? [currentSchema.primaryKey.field] : []),
    ...(currentSchema.timestamps ? ['createdAt', 'updatedAt'] : []),
  ])

  // Detect removed columns
  for (const field of allPreviousFields) {
    if (!allCurrentFields.has(field)) {
      changes.push({
        type: 'column_removed',
        table: tableName,
        column: field,
        description: `Removed column '${field}' from table '${tableName}'`,
        destructive: true,
      })
    }
  }

  // Detect added and modified columns
  for (const field of allCurrentFields) {
    const previousProp = previousProps.get(field)
    const currentProp = currentProps.get(field)

    if (!allPreviousFields.has(field)) {
      // New column
      changes.push({
        type: 'column_added',
        table: tableName,
        column: field,
        description: `Added column '${field}' to table '${tableName}'`,
        destructive: false,
      })
      continue
    }

    // Skip if both are generated fields (they don't change)
    if (!previousProp || !currentProp) {
      continue
    }

    // Check for type changes
    if (previousProp.type !== currentProp.type) {
      changes.push({
        type: 'column_type_changed',
        table: tableName,
        column: field,
        description: `Changed type of column '${field}' in table '${tableName}' from '${previousProp.type}' to '${currentProp.type}'`,
        destructive: true,
        oldValue: previousProp.type,
        newValue: currentProp.type,
      })
    }

    // Check for nullability changes
    if (previousProp.optional !== currentProp.optional) {
      const fromNullable = previousProp.optional
      const toNullable = currentProp.optional

      changes.push({
        type: 'column_nullable_changed',
        table: tableName,
        column: field,
        description: `Changed column '${field}' in table '${tableName}' from ${fromNullable ? 'nullable' : 'not null'} to ${toNullable ? 'nullable' : 'not null'}`,
        destructive: !toNullable, // Making a column not null can be destructive
        oldValue: fromNullable,
        newValue: toNullable,
      })
    }
  }

  return changes
}

/**
 * Compare primary keys between two schemas
 */
function comparePrimaryKeys(
  previousSchema: AnalyzedInterface,
  currentSchema: AnalyzedInterface
): SchemaChange[] {
  const changes: SchemaChange[] = []
  const tableName = currentSchema.tableName

  const previousPK = previousSchema.primaryKey
  const currentPK = currentSchema.primaryKey

  // Check if primary key definition changed
  if (previousPK && currentPK) {
    if (
      previousPK.field !== currentPK.field ||
      previousPK.type !== currentPK.type
    ) {
      changes.push({
        type: 'primary_key_changed',
        table: tableName,
        column: currentPK.field,
        description: `Changed primary key in table '${tableName}'`,
        destructive: true,
        oldValue: previousPK,
        newValue: currentPK,
      })
    }
  }

  return changes
}

/**
 * Compare foreign keys between two schemas
 */
function compareForeignKeys(
  previousSchema: AnalyzedInterface,
  currentSchema: AnalyzedInterface
): SchemaChange[] {
  const changes: SchemaChange[] = []
  const tableName = currentSchema.tableName

  const previousFKs = new Map(
    previousSchema.foreignKeys.map(fk => [fk.field, fk])
  )
  const currentFKs = new Map(
    currentSchema.foreignKeys.map(fk => [fk.field, fk])
  )

  // Detect removed foreign keys
  for (const [field, fk] of previousFKs) {
    if (!currentFKs.has(field)) {
      changes.push({
        type: 'foreign_key_removed',
        table: tableName,
        column: field,
        description: `Removed foreign key on '${field}' in table '${tableName}' (was referencing '${fk.referencesTable}.${fk.referencesField}')`,
        destructive: false,
      })
    }
  }

  // Detect added or modified foreign keys
  for (const [field, currentFK] of currentFKs) {
    const previousFK = previousFKs.get(field)

    if (!previousFK) {
      // New foreign key
      changes.push({
        type: 'foreign_key_added',
        table: tableName,
        column: field,
        description: `Added foreign key on '${field}' in table '${tableName}' referencing '${currentFK.referencesTable}.${currentFK.referencesField}'`,
        destructive: false,
      })
    } else if (
      previousFK.referencesTable !== currentFK.referencesTable ||
      previousFK.referencesField !== currentFK.referencesField
    ) {
      // Foreign key changed
      changes.push({
        type: 'foreign_key_removed',
        table: tableName,
        column: field,
        description: `Modified foreign key on '${field}' in table '${tableName}'`,
        destructive: false,
        oldValue: previousFK,
        newValue: currentFK,
      })
      changes.push({
        type: 'foreign_key_added',
        table: tableName,
        column: field,
        description: `Modified foreign key on '${field}' in table '${tableName}'`,
        destructive: false,
        oldValue: previousFK,
        newValue: currentFK,
      })
    }
  }

  return changes
}

/**
 * Compare unique constraints between two schemas
 */
function compareUniqueConstraints(
  previousSchema: AnalyzedInterface,
  currentSchema: AnalyzedInterface
): SchemaChange[] {
  const changes: SchemaChange[] = []
  const tableName = currentSchema.tableName

  const previousUnique = new Set(previousSchema.uniqueFields)
  const currentUnique = new Set(currentSchema.uniqueFields)

  // Detect removed unique constraints
  for (const field of previousUnique) {
    if (!currentUnique.has(field)) {
      changes.push({
        type: 'unique_constraint_removed',
        table: tableName,
        column: field,
        description: `Removed unique constraint on '${field}' in table '${tableName}'`,
        destructive: false,
      })
    }
  }

  // Detect added unique constraints
  for (const field of currentUnique) {
    if (!previousUnique.has(field)) {
      changes.push({
        type: 'unique_constraint_added',
        table: tableName,
        column: field,
        description: `Added unique constraint on '${field}' in table '${tableName}'`,
        destructive: true, // Can fail if duplicate values exist
      })
    }
  }

  return changes
}
