/**
 * Tests for snapshot management
 */

import { describe, it, expect } from 'vitest'
import { createSnapshot, hashSchemas } from '../../src/migrations/snapshot'
import type { AnalyzedInterface } from '../../src/generator/analyzer'

describe('Snapshot Management', () => {
  describe('hashSchemas', () => {
    it('should generate consistent hash for same schemas', () => {
      const schemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'name', type: 'string', optional: false, jsDocTags: {} },
              { name: 'email', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: { field: 'id', type: 'uuid' },
          foreignKeys: [],
          uniqueFields: ['email'],
          timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
        },
      ]

      const hash1 = hashSchemas(schemas)
      const hash2 = hashSchemas(schemas)

      expect(hash1).toBe(hash2)
      expect(hash1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hash
    })

    it('should generate different hash for different schemas', () => {
      const schemas1: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [{ name: 'name', type: 'string', optional: false, jsDocTags: {} }],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: { field: 'id', type: 'uuid' },
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const schemas2: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [{ name: 'email', type: 'string', optional: false, jsDocTags: {} }],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: { field: 'id', type: 'uuid' },
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const hash1 = hashSchemas(schemas1)
      const hash2 = hashSchemas(schemas2)

      expect(hash1).not.toBe(hash2)
    })

    it('should sort schemas by table name for consistent hashing', () => {
      const schemasA: AnalyzedInterface[] = [
        {
          interface: { name: 'User', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
        {
          interface: { name: 'Post', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const schemasB: AnalyzedInterface[] = [
        {
          interface: { name: 'Post', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
        {
          interface: { name: 'User', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const hashA = hashSchemas(schemasA)
      const hashB = hashSchemas(schemasB)

      expect(hashA).toBe(hashB) // Order shouldn't matter
    })
  })

  describe('createSnapshot', () => {
    it('should create snapshot with correct structure', () => {
      const schemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [{ name: 'name', type: 'string', optional: false, jsDocTags: {} }],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: { field: 'id', type: 'uuid' },
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const snapshot = createSnapshot(schemas, 'postgres')

      expect(snapshot).toMatchObject({
        databaseType: 'postgres',
        schemas,
      })
      expect(snapshot.timestamp).toBeDefined()
      expect(snapshot.version).toBeDefined()
      expect(snapshot.hash).toBeDefined()
      expect(new Date(snapshot.timestamp)).toBeInstanceOf(Date)
    })

    it('should use ISO timestamp as version', () => {
      const schemas: AnalyzedInterface[] = []
      const snapshot = createSnapshot(schemas, 'sqlite')

      expect(snapshot.version).toBe(snapshot.timestamp)
      expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should include correct database type', () => {
      const schemas: AnalyzedInterface[] = []

      const pgSnapshot = createSnapshot(schemas, 'postgres')
      expect(pgSnapshot.databaseType).toBe('postgres')

      const sqliteSnapshot = createSnapshot(schemas, 'sqlite')
      expect(sqliteSnapshot.databaseType).toBe('sqlite')
    })

    it('should hash the schemas', () => {
      const schemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [{ name: 'name', type: 'string', optional: false, jsDocTags: {} }],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const snapshot = createSnapshot(schemas, 'postgres')
      const expectedHash = hashSchemas(schemas)

      expect(snapshot.hash).toBe(expectedHash)
    })
  })
})
