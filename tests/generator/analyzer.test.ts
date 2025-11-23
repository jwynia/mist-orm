import { describe, it, expect } from 'vitest'
import { analyzeInterface, AnalyzedInterface, detectPrimaryKey, detectForeignKeys, detectTimestamps, detectUniqueConstraints } from '../../src/generator/analyzer'
import type { ParsedInterface } from '../../src/parser/types'
import type { ResolvedMistConfig } from '../../src/config/types'

const defaultConfig: ResolvedMistConfig = {
  models: './models',
  output: './.mist',
  connection: 'postgres://localhost/test',
  conventions: {
    timestamps: true,
    primaryKey: 'id',
    foreignKeys: {},
    unique: {},
    exclude: [],
  },
  database: {
    type: 'postgres',
    schema: 'public',
  },
  dev: {
    autoMigrate: false,
    watch: [],
  },
}

describe('Convention Detector', () => {
  describe('detectPrimaryKey', () => {
    it('should detect id field as primary key', () => {
      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'name', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const pk = detectPrimaryKey(iface, defaultConfig)

      expect(pk).toEqual({
        field: 'id',
        type: 'uuid', // string -> UUID
      })
    })

    it('should detect numeric id as serial', () => {
      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'number', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const pk = detectPrimaryKey(iface, defaultConfig)

      expect(pk).toEqual({
        field: 'id',
        type: 'serial',
      })
    })

    it('should respect custom primary key field name', () => {
      const config = {
        ...defaultConfig,
        conventions: {
          ...defaultConfig.conventions,
          primaryKey: '_id',
        },
      }

      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: '_id', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const pk = detectPrimaryKey(iface, config)

      expect(pk?.field).toBe('_id')
    })

    it('should auto-generate primary key if not in interface (PostgreSQL)', () => {
      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'name', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const pk = detectPrimaryKey(iface, defaultConfig)

      expect(pk).toEqual({
        field: 'id',
        type: 'uuid', // Auto-generated for PostgreSQL
      })
    })

    it('should auto-generate primary key if not in interface (SQLite)', () => {
      const config = {
        ...defaultConfig,
        database: {
          ...defaultConfig.database,
          type: 'sqlite' as const,
        },
      }

      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'name', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const pk = detectPrimaryKey(iface, config)

      expect(pk).toEqual({
        field: 'id',
        type: 'serial', // Auto-generated for SQLite (integer auto-increment)
      })
    })
  })

  describe('detectForeignKeys', () => {
    it('should detect userId as foreign key to users', () => {
      const iface: ParsedInterface = {
        name: 'Post',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'userId', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const fks = detectForeignKeys(iface, defaultConfig)

      expect(fks).toEqual([
        {
          field: 'userId',
          referencesTable: 'users',
          referencesField: 'id',
        },
      ])
    })

    it('should detect multiple foreign keys', () => {
      const iface: ParsedInterface = {
        name: 'Comment',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'userId', type: 'string', optional: false, jsDocTags: {} },
          { name: 'postId', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const fks = detectForeignKeys(iface, defaultConfig)

      expect(fks).toHaveLength(2)
      expect(fks[0]).toEqual({
        field: 'userId',
        referencesTable: 'users',
        referencesField: 'id',
      })
      expect(fks[1]).toEqual({
        field: 'postId',
        referencesTable: 'posts',
        referencesField: 'id',
      })
    })

    it('should respect custom foreign key mappings from config', () => {
      const config = {
        ...defaultConfig,
        conventions: {
          ...defaultConfig.conventions,
          foreignKeys: {
            authorId: 'users',
          },
        },
      }

      const iface: ParsedInterface = {
        name: 'Post',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'authorId', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const fks = detectForeignKeys(iface, config)

      expect(fks).toEqual([
        {
          field: 'authorId',
          referencesTable: 'users',
          referencesField: 'id',
        },
      ])
    })

    it('should not detect primary key as foreign key', () => {
      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const fks = detectForeignKeys(iface, defaultConfig)

      expect(fks).toHaveLength(0)
    })
  })

  describe('detectTimestamps', () => {
    it('should add createdAt and updatedAt when enabled', () => {
      const timestamps = detectTimestamps(defaultConfig)

      expect(timestamps).toEqual({
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      })
    })

    it('should return null when timestamps disabled', () => {
      const config = {
        ...defaultConfig,
        conventions: {
          ...defaultConfig.conventions,
          timestamps: false,
        },
      }

      const timestamps = detectTimestamps(config)

      expect(timestamps).toBeNull()
    })
  })

  describe('detectUniqueConstraints', () => {
    it('should detect @unique JSDoc tag', () => {
      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'email', type: 'string', optional: false, jsDocTags: { unique: '' } },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const unique = detectUniqueConstraints(iface, defaultConfig)

      expect(unique).toEqual(['email'])
    })

    it('should use unique constraints from config', () => {
      const config = {
        ...defaultConfig,
        conventions: {
          ...defaultConfig.conventions,
          unique: {
            User: ['email', 'username'],
          },
        },
      }

      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'email', type: 'string', optional: false, jsDocTags: {} },
          { name: 'username', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const unique = detectUniqueConstraints(iface, config)

      expect(unique).toEqual(['email', 'username'])
    })

    it('should combine JSDoc tags and config', () => {
      const config = {
        ...defaultConfig,
        conventions: {
          ...defaultConfig.conventions,
          unique: {
            User: ['username'],
          },
        },
      }

      const iface: ParsedInterface = {
        name: 'User',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'email', type: 'string', optional: false, jsDocTags: { unique: '' } },
          { name: 'username', type: 'string', optional: false, jsDocTags: {} },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const unique = detectUniqueConstraints(iface, config)

      expect(unique).toContain('email')
      expect(unique).toContain('username')
    })
  })

  describe('analyzeInterface', () => {
    it('should perform complete analysis', () => {
      const iface: ParsedInterface = {
        name: 'Post',
        properties: [
          { name: 'id', type: 'string', optional: false, jsDocTags: {} },
          { name: 'title', type: 'string', optional: false, jsDocTags: {} },
          { name: 'userId', type: 'string', optional: false, jsDocTags: {} },
          { name: 'slug', type: 'string', optional: false, jsDocTags: { unique: '' } },
        ],
        location: { file: 'test.ts', line: 1 },
      }

      const analyzed = analyzeInterface(iface, defaultConfig)

      expect(analyzed.interface).toBe(iface)
      expect(analyzed.tableName).toBe('posts')
      expect(analyzed.primaryKey).toEqual({
        field: 'id',
        type: 'uuid',
      })
      expect(analyzed.foreignKeys).toHaveLength(1)
      expect(analyzed.foreignKeys[0].field).toBe('userId')
      expect(analyzed.uniqueFields).toContain('slug')
      expect(analyzed.timestamps).toEqual({
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      })
    })

    it('should convert interface name to lowercase table name', () => {
      const iface: ParsedInterface = {
        name: 'UserProfile',
        properties: [],
        location: { file: 'test.ts', line: 1 },
      }

      const analyzed = analyzeInterface(iface, defaultConfig)

      expect(analyzed.tableName).toBe('userprofiles')
    })
  })
})
