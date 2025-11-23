/**
 * SQLite Drizzle schema generator
 */

import type { AnalyzedInterface } from './analyzer'
import { mapTypeToColumn } from './types'

export interface GeneratedSchema {
  /**
   * Generated TypeScript code
   */
  code: string

  /**
   * Table name
   */
  tableName: string

  /**
   * Required imports from drizzle-orm/sqlite-core
   */
  imports: string[]

  /**
   * Tables referenced by foreign keys
   */
  referencedTables: string[]
}

/**
 * Converts camelCase to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Generates a single column definition for SQLite
 */
function generateColumn(
  fieldName: string,
  tsType: string,
  optional: boolean,
  options: {
    isPrimaryKey?: boolean
    pkType?: 'uuid' | 'serial' | 'text'
    isUnique?: boolean
    isForeignKey?: boolean
    referencesTable?: string
    referencesField?: string
    isTimestamp?: boolean
  } = {}
): { code: string; imports: string[] } {
  const columnName = toSnakeCase(fieldName)
  const column = mapTypeToColumn(tsType, 'sqlite', optional)
  const imports = new Set<string>([column.importName])

  // Build column definition
  let columnDef: string

  if (options.isPrimaryKey) {
    if (options.pkType === 'uuid' || options.pkType === 'text') {
      imports.add('text')
      columnDef = `${fieldName}: text('${columnName}').primaryKey()`
    } else if (options.pkType === 'serial') {
      imports.add('integer')
      columnDef = `${fieldName}: integer('${columnName}').primaryKey()`
    } else {
      columnDef = `${fieldName}: ${column.drizzleType}('${columnName}').primaryKey()`
    }
  } else if (options.isForeignKey && options.referencesTable) {
    // Foreign key reference
    const refTableVar = options.referencesTable
    const refField = options.referencesField || 'id'

    imports.add('text')
    columnDef = `${fieldName}: text('${columnName}').notNull().references(() => ${refTableVar}.${refField})`
  } else if (options.isTimestamp) {
    // Timestamps in SQLite are stored as integers (unix time)
    imports.add('integer')
    columnDef = `${fieldName}: integer('${columnName}').notNull()`
  } else {
    // Regular column
    const typeCall = `${column.drizzleType}('${columnName}')`

    let modifiers = ''
    if (column.notNull) {
      modifiers += '.notNull()'
    }
    if (options.isUnique) {
      modifiers += '.unique()'
    }

    columnDef = `${fieldName}: ${typeCall}${modifiers}`
  }

  return {
    code: columnDef,
    imports: Array.from(imports),
  }
}

/**
 * Generates SQLite Drizzle schema
 */
export function generateSqliteSchema(analyzed: AnalyzedInterface): GeneratedSchema {
  const allImports = new Set<string>(['sqliteTable'])
  const columnDefs: string[] = []
  const referencedTables: string[] = []

  const { interface: iface, tableName, primaryKey, foreignKeys, uniqueFields, timestamps } = analyzed

  // Add primary key field first (auto-generated if not in interface)
  const pkField = iface.properties.find(p => p.name === primaryKey.field)
  const pkCol = generateColumn(
    primaryKey.field,
    pkField?.type || 'number', // Default to number for SQLite auto-increment
    false, // Primary key is never optional
    {
      isPrimaryKey: true,
      pkType: primaryKey.type,
    }
  )
  columnDefs.push(pkCol.code)
  pkCol.imports.forEach(imp => allImports.add(imp))

  // Generate columns for each property (skip primary key since we already added it)
  for (const prop of iface.properties) {
    // Skip primary key - already added above
    if (prop.name === primaryKey.field) {
      continue
    }

    const isUnique = uniqueFields.includes(prop.name)
    const fk = foreignKeys.find(f => f.field === prop.name)

    if (fk) {
      const col = generateColumn(prop.name, prop.type, prop.optional, {
        isForeignKey: true,
        referencesTable: fk.referencesTable,
        referencesField: fk.referencesField,
      })
      columnDefs.push(col.code)
      col.imports.forEach(imp => allImports.add(imp))
      referencedTables.push(fk.referencesTable)
    } else {
      const col = generateColumn(prop.name, prop.type, prop.optional, {
        isUnique,
      })
      columnDefs.push(col.code)
      col.imports.forEach(imp => allImports.add(imp))
    }
  }

  // Add timestamp columns if configured (SQLite stores as integers)
  if (timestamps) {
    allImports.add('integer')
    columnDefs.push(
      `${timestamps.createdAt}: integer('${toSnakeCase(timestamps.createdAt)}').notNull()`
    )
    columnDefs.push(
      `${timestamps.updatedAt}: integer('${toSnakeCase(timestamps.updatedAt)}').notNull()`
    )
  }

  // Build the schema code
  const imports = Array.from(allImports).sort()
  const importStatement = `import { ${imports.join(', ')} } from 'drizzle-orm/sqlite-core'`

  // Add imports for referenced tables
  const tableImports = referencedTables.map(table => `import { ${table} } from './${table}'`).join('\n')

  const header = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * Generated by mist-orm from ${iface.location.file}
 */`

  const tableDefinition = `export const ${tableName} = sqliteTable('${tableName}', {
  ${columnDefs.join(',\n  ')},
})`

  const code = [
    header,
    importStatement,
    tableImports || '',
    '',
    tableDefinition,
  ].filter(Boolean).join('\n')

  return {
    code,
    tableName,
    imports,
    referencedTables,
  }
}
