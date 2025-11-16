import { describe, it, expect } from 'vitest'
import { mapTypeToColumn, ColumnDefinition } from '../../src/generator/types'

describe('Type Mapper', () => {
  describe('mapTypeToColumn - PostgreSQL', () => {
    it('should map string to text', () => {
      const result = mapTypeToColumn('string', 'postgres', false)
      expect(result.drizzleType).toBe('text')
      expect(result.importName).toBe('text')
    })

    it('should map number to integer', () => {
      const result = mapTypeToColumn('number', 'postgres', false)
      expect(result.drizzleType).toBe('integer')
      expect(result.importName).toBe('integer')
    })

    it('should map boolean to boolean', () => {
      const result = mapTypeToColumn('boolean', 'postgres', false)
      expect(result.drizzleType).toBe('boolean')
      expect(result.importName).toBe('boolean')
    })

    it('should map Date to timestamp', () => {
      const result = mapTypeToColumn('Date', 'postgres', false)
      expect(result.drizzleType).toBe('timestamp')
      expect(result.importName).toBe('timestamp')
    })

    it('should map string[] to text array', () => {
      const result = mapTypeToColumn('string[]', 'postgres', false)
      expect(result.drizzleType).toBe('text')
      expect(result.isArray).toBe(true)
      expect(result.importName).toBe('text')
    })

    it('should map number[] to integer array', () => {
      const result = mapTypeToColumn('number[]', 'postgres', false)
      expect(result.drizzleType).toBe('integer')
      expect(result.isArray).toBe(true)
    })

    it('should map Record<string, any> to jsonb', () => {
      const result = mapTypeToColumn('Record<string, any>', 'postgres', false)
      expect(result.drizzleType).toBe('jsonb')
      expect(result.importName).toBe('jsonb')
    })

    it('should handle optional fields (nullable)', () => {
      const required = mapTypeToColumn('string', 'postgres', false)
      const optional = mapTypeToColumn('string', 'postgres', true)

      expect(required.notNull).toBe(true)
      expect(optional.notNull).toBe(false)
    })

    it('should default unknown types to text with warning', () => {
      const result = mapTypeToColumn('UnknownType', 'postgres', false)
      expect(result.drizzleType).toBe('text')
      expect(result.needsManualReview).toBe(true)
    })
  })

  describe('mapTypeToColumn - SQLite', () => {
    it('should map string to text', () => {
      const result = mapTypeToColumn('string', 'sqlite', false)
      expect(result.drizzleType).toBe('text')
      expect(result.importName).toBe('text')
    })

    it('should map number to integer', () => {
      const result = mapTypeToColumn('number', 'sqlite', false)
      expect(result.drizzleType).toBe('integer')
      expect(result.importName).toBe('integer')
    })

    it('should map boolean to integer (SQLite stores as 0/1)', () => {
      const result = mapTypeToColumn('boolean', 'sqlite', false)
      expect(result.drizzleType).toBe('integer')
      expect(result.importName).toBe('integer')
      expect(result.comment).toContain('boolean')
    })

    it('should map Date to integer (unix timestamp)', () => {
      const result = mapTypeToColumn('Date', 'sqlite', false)
      expect(result.drizzleType).toBe('integer')
      expect(result.importName).toBe('integer')
      expect(result.comment).toContain('timestamp')
    })

    it('should map string[] to text (JSON serialized)', () => {
      const result = mapTypeToColumn('string[]', 'sqlite', false)
      expect(result.drizzleType).toBe('text')
      expect(result.isArray).toBe(false) // SQLite doesn't have native arrays
      expect(result.comment).toContain('JSON')
    })

    it('should map Record to text (JSON serialized)', () => {
      const result = mapTypeToColumn('Record<string, any>', 'sqlite', false)
      expect(result.drizzleType).toBe('text')
      expect(result.comment).toContain('JSON')
    })
  })

  describe('ColumnDefinition', () => {
    it('should build proper column definition for required field', () => {
      const col: ColumnDefinition = {
        drizzleType: 'text',
        importName: 'text',
        notNull: true,
        isArray: false,
      }

      expect(col.notNull).toBe(true)
      expect(col.isArray).toBe(false)
    })

    it('should include modifiers for special cases', () => {
      const col: ColumnDefinition = {
        drizzleType: 'uuid',
        importName: 'uuid',
        notNull: true,
        isArray: false,
        modifiers: ['defaultRandom()', 'primaryKey()'],
      }

      expect(col.modifiers).toEqual(['defaultRandom()', 'primaryKey()'])
    })
  })
})
