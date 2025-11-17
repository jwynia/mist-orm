import { describe, it, expect } from 'vitest'
import { generateSqliteSchema } from '../../src/generator/sqlite'
import type { AnalyzedInterface } from '../../src/generator/analyzer'
import type { ParsedInterface } from '../../src/parser/types'

describe('SQLite Schema Generator', () => {
  it('should generate simple table schema', () => {
    const iface: ParsedInterface = {
      name: 'User',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'name', type: 'string', optional: false, jsDocTags: {} },
        { name: 'email', type: 'string', optional: false, jsDocTags: {} },
      ],
      location: { file: 'user.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'users',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: ['email'],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("from 'drizzle-orm/sqlite-core'")
    expect(result.code).toContain("sqliteTable")
    expect(result.code).toContain("export const users = sqliteTable('users', {")
    expect(result.code).toContain("id: text('id').primaryKey()")
    expect(result.code).toContain("name: text('name').notNull()")
    expect(result.code).toContain("email: text('email').notNull().unique()")
    expect(result.tableName).toBe('users')
    expect(result.imports).toContain('sqliteTable')
    expect(result.imports).toContain('text')
  })

  it('should handle numeric IDs as integer', () => {
    const iface: ParsedInterface = {
      name: 'User',
      properties: [
        { name: 'id', type: 'number', optional: false, jsDocTags: {} },
      ],
      location: { file: 'user.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'users',
      primaryKey: { field: 'id', type: 'serial' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("id: integer('id').primaryKey()")
    expect(result.imports).toContain('integer')
  })

  it('should map boolean to integer', () => {
    const iface: ParsedInterface = {
      name: 'Post',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'published', type: 'boolean', optional: false, jsDocTags: {} },
      ],
      location: { file: 'post.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'posts',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("published: integer('published').notNull()")
  })

  it('should map Date to integer (unix timestamp)', () => {
    const iface: ParsedInterface = {
      name: 'Event',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'occurredAt', type: 'Date', optional: false, jsDocTags: {} },
      ],
      location: { file: 'event.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'events',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("occurredAt: integer('occurred_at').notNull()")
  })

  it('should map arrays to text (JSON)', () => {
    const iface: ParsedInterface = {
      name: 'Product',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'tags', type: 'string[]', optional: false, jsDocTags: {} },
      ],
      location: { file: 'product.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'products',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    // SQLite doesn't have array types, should use text
    expect(result.code).toContain("tags: text('tags').notNull()")
  })

  it('should map Record to text (JSON)', () => {
    const iface: ParsedInterface = {
      name: 'Product',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'metadata', type: 'Record<string, any>', optional: false, jsDocTags: {} },
      ],
      location: { file: 'product.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'products',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("metadata: text('metadata').notNull()")
  })

  it('should generate schema with foreign keys', () => {
    const iface: ParsedInterface = {
      name: 'Post',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'userId', type: 'string', optional: false, jsDocTags: {} },
      ],
      location: { file: 'post.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'posts',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [
        {
          field: 'userId',
          referencesTable: 'users',
          referencesField: 'id',
        },
      ],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generateSqliteSchema(analyzed)

    expect(result.code).toContain("import { users } from './users'")
    expect(result.code).toContain("userId: text('user_id').notNull().references(() => users.id)")
    expect(result.referencedTables).toEqual(['users'])
  })

  it('should generate schema with timestamps', () => {
    const iface: ParsedInterface = {
      name: 'Post',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
      ],
      location: { file: 'post.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'posts',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    }

    const result = generateSqliteSchema(analyzed)

    // SQLite stores timestamps as integers (unix time)
    expect(result.code).toContain("createdAt: integer('created_at').notNull()")
    expect(result.code).toContain("updatedAt: integer('updated_at').notNull()")
  })
})
