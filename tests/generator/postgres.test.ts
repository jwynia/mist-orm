import { describe, it, expect } from 'vitest'
import { generatePostgresSchema } from '../../src/generator/postgres'
import type { AnalyzedInterface } from '../../src/generator/analyzer'
import type { ParsedInterface } from '../../src/parser/types'

describe('PostgreSQL Schema Generator', () => {
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("from 'drizzle-orm/pg-core'")
    // Check imports are present (order doesn't matter since they're sorted)
    expect(result.imports).toContain('pgTable')
    expect(result.imports).toContain('uuid')
    expect(result.imports).toContain('text')
    expect(result.code).toContain("export const users = pgTable('users', {")
    expect(result.code).toContain("id: uuid('id').defaultRandom().primaryKey()")
    expect(result.code).toContain("name: text('name').notNull()")
    expect(result.code).toContain("email: text('email').notNull().unique()")
    expect(result.tableName).toBe('users')
  })

  it('should generate schema with timestamps', () => {
    const iface: ParsedInterface = {
      name: 'Post',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'title', type: 'string', optional: false, jsDocTags: {} },
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain('timestamp')
    expect(result.code).toContain("createdAt: timestamp('created_at').defaultNow().notNull()")
    expect(result.code).toContain("updatedAt: timestamp('updated_at').defaultNow().notNull()")
    expect(result.imports).toContain('timestamp')
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("import { users } from './users'")
    expect(result.code).toContain("userId: uuid('user_id').notNull().references(() => users.id)")
    expect(result.referencedTables).toEqual(['users'])
  })

  it('should generate schema with optional fields', () => {
    const iface: ParsedInterface = {
      name: 'Post',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'title', type: 'string', optional: false, jsDocTags: {} },
        { name: 'subtitle', type: 'string', optional: true, jsDocTags: {} },
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("title: text('title').notNull()")
    expect(result.code).toContain("subtitle: text('subtitle')") // No .notNull()
    expect(result.code).not.toMatch(/subtitle.*notNull/)
  })

  it('should handle different data types', () => {
    const iface: ParsedInterface = {
      name: 'Product',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'name', type: 'string', optional: false, jsDocTags: {} },
        { name: 'price', type: 'number', optional: false, jsDocTags: {} },
        { name: 'inStock', type: 'boolean', optional: false, jsDocTags: {} },
        { name: 'createdAt', type: 'Date', optional: false, jsDocTags: {} },
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

    const result = generatePostgresSchema(analyzed)

    expect(result.imports).toContain('text')
    expect(result.imports).toContain('integer')
    expect(result.imports).toContain('boolean')
    expect(result.imports).toContain('timestamp')
    expect(result.code).toContain("name: text('name').notNull()")
    expect(result.code).toContain("price: integer('price').notNull()")
    expect(result.code).toContain("inStock: boolean('in_stock').notNull()")
    expect(result.code).toContain("createdAt: timestamp('created_at').notNull()")
  })

  it('should handle array types', () => {
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("tags: text('tags').array().notNull()")
  })

  it('should handle Record types as jsonb', () => {
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

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("metadata: jsonb('metadata').notNull()")
    expect(result.imports).toContain('jsonb')
  })

  it('should convert field names to snake_case for SQL', () => {
    const iface: ParsedInterface = {
      name: 'User',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        { name: 'firstName', type: 'string', optional: false, jsDocTags: {} },
        { name: 'lastName', type: 'string', optional: false, jsDocTags: {} },
      ],
      location: { file: 'user.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'users',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain("firstName: text('first_name').notNull()")
    expect(result.code).toContain("lastName: text('last_name').notNull()")
  })

  it('should add AUTO-GENERATED header comment', () => {
    const iface: ParsedInterface = {
      name: 'User',
      properties: [
        { name: 'id', type: 'string', optional: false, jsDocTags: {} },
      ],
      location: { file: 'user.ts', line: 1 },
    }

    const analyzed: AnalyzedInterface = {
      interface: iface,
      tableName: 'users',
      primaryKey: { field: 'id', type: 'uuid' },
      foreignKeys: [],
      uniqueFields: [],
      timestamps: null,
    }

    const result = generatePostgresSchema(analyzed)

    expect(result.code).toContain('AUTO-GENERATED')
    expect(result.code).toContain('DO NOT EDIT')
    expect(result.code).toContain('Generated by mist-orm')
  })
})
