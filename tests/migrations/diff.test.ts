/**
 * Tests for schema diff detection
 */

import { describe, it, expect } from 'vitest'
import { detectChanges } from '../../src/migrations/diff'
import { createSnapshot } from '../../src/migrations/snapshot'
import type { AnalyzedInterface } from '../../src/generator/analyzer'

describe('Schema Diff Detection', () => {
  describe('detectChanges', () => {
    it('should detect no changes when schemas are identical', () => {
      const schemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'name', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: { field: 'id', type: 'uuid' },
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(schemas, 'postgres')
      const diff = detectChanges(previousSnapshot, schemas)

      expect(diff.hasChanges).toBe(false)
      expect(diff.changes).toHaveLength(0)
      expect(diff.hasDestructiveChanges).toBe(false)
    })

    it('should detect all tables as added when no previous snapshot exists', () => {
      const schemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const diff = detectChanges(null, schemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.changes).toHaveLength(2)
      expect(diff.changes.every(c => c.type === 'table_added')).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(false)
    })

    it('should detect table removal', () => {
      const previousSchemas: AnalyzedInterface[] = [
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

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: { name: 'User', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.changes).toHaveLength(1)
      expect(diff.changes[0]).toMatchObject({
        type: 'table_removed',
        table: 'posts',
        destructive: true,
      })
      expect(diff.hasDestructiveChanges).toBe(true)
    })

    it('should detect table addition', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: { name: 'User', properties: [], location: { file: 'test.ts', line: 1 } },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
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

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.changes).toHaveLength(1)
      expect(diff.changes[0]).toMatchObject({
        type: 'table_added',
        table: 'posts',
        destructive: false,
      })
    })

    it('should detect column addition', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'name', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
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
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      const columnChange = diff.changes.find(c => c.type === 'column_added')
      expect(columnChange).toBeDefined()
      expect(columnChange).toMatchObject({
        type: 'column_added',
        table: 'users',
        column: 'email',
        destructive: false,
      })
    })

    it('should detect column removal', () => {
      const previousSchemas: AnalyzedInterface[] = [
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
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'name', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(true)
      const columnChange = diff.changes.find(c => c.type === 'column_removed')
      expect(columnChange).toBeDefined()
      expect(columnChange).toMatchObject({
        type: 'column_removed',
        table: 'users',
        column: 'email',
        destructive: true,
      })
    })

    it('should detect column type change', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'age', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'age', type: 'number', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(true)
      const typeChange = diff.changes.find(c => c.type === 'column_type_changed')
      expect(typeChange).toBeDefined()
      expect(typeChange).toMatchObject({
        type: 'column_type_changed',
        table: 'users',
        column: 'age',
        destructive: true,
        oldValue: 'string',
        newValue: 'number',
      })
    })

    it('should detect nullability change (optional to required)', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'email', type: 'string', optional: true, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'email', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(true) // Making column NOT NULL can be destructive
      const nullChange = diff.changes.find(c => c.type === 'column_nullable_changed')
      expect(nullChange).toBeDefined()
      expect(nullChange).toMatchObject({
        type: 'column_nullable_changed',
        table: 'users',
        column: 'email',
        destructive: true,
        oldValue: true,
        newValue: false,
      })
    })

    it('should detect nullability change (required to optional)', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'email', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'email', type: 'string', optional: true, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(false) // Making nullable is safe
      const nullChange = diff.changes.find(c => c.type === 'column_nullable_changed')
      expect(nullChange).toMatchObject({
        destructive: false,
      })
    })

    it('should detect foreign key addition', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [
            {
              field: 'userId',
              referencesTable: 'users',
              referencesField: 'id',
            },
          ],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      const fkChange = diff.changes.find(c => c.type === 'foreign_key_added')
      expect(fkChange).toBeDefined()
      expect(fkChange).toMatchObject({
        type: 'foreign_key_added',
        table: 'posts',
        column: 'userId',
        destructive: false,
      })
    })

    it('should detect foreign key removal', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [
            {
              field: 'userId',
              referencesTable: 'users',
              referencesField: 'id',
            },
          ],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      const fkChange = diff.changes.find(c => c.type === 'foreign_key_removed')
      expect(fkChange).toBeDefined()
      expect(fkChange).toMatchObject({
        type: 'foreign_key_removed',
        table: 'posts',
        column: 'userId',
        destructive: false,
      })
    })

    it('should detect unique constraint addition', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: ['email'],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.hasDestructiveChanges).toBe(true) // Can fail if duplicates exist
      const uniqueChange = diff.changes.find(c => c.type === 'unique_constraint_added')
      expect(uniqueChange).toBeDefined()
      expect(uniqueChange).toMatchObject({
        type: 'unique_constraint_added',
        table: 'users',
        column: 'email',
        destructive: true,
      })
    })

    it('should detect unique constraint removal', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: ['email'],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      const uniqueChange = diff.changes.find(c => c.type === 'unique_constraint_removed')
      expect(uniqueChange).toBeDefined()
      expect(uniqueChange).toMatchObject({
        type: 'unique_constraint_removed',
        table: 'users',
        column: 'email',
        destructive: false,
      })
    })

    it('should detect multiple changes in one diff', () => {
      const previousSchemas: AnalyzedInterface[] = [
        {
          interface: {
            name: 'User',
            properties: [
              { name: 'name', type: 'string', optional: false, jsDocTags: {} },
            ],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'users',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const currentSchemas: AnalyzedInterface[] = [
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
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: ['email'],
          timestamps: null,
        },
        {
          interface: {
            name: 'Post',
            properties: [],
            location: { file: 'test.ts', line: 1 },
          },
          tableName: 'posts',
          primaryKey: null,
          foreignKeys: [],
          uniqueFields: [],
          timestamps: null,
        },
      ]

      const previousSnapshot = createSnapshot(previousSchemas, 'postgres')
      const diff = detectChanges(previousSnapshot, currentSchemas)

      expect(diff.hasChanges).toBe(true)
      expect(diff.changes.length).toBeGreaterThanOrEqual(3) // table_added, column_added, unique_added
      expect(diff.changes.some(c => c.type === 'table_added')).toBe(true)
      expect(diff.changes.some(c => c.type === 'column_added')).toBe(true)
      expect(diff.changes.some(c => c.type === 'unique_constraint_added')).toBe(true)
    })
  })
})
