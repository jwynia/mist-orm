/**
 * Tests for client code generation
 */

import { describe, it, expect } from 'vitest'
import { generateClient } from '../../src/generator/client'
import type { GeneratedSchema } from '../../src/generator/postgres'

describe('Client Generator', () => {
  const mockSchemas: GeneratedSchema[] = [
    {
      tableName: 'users',
      code: 'export const users = pgTable(...)',
      referencedTables: []
    },
    {
      tableName: 'posts',
      code: 'export const posts = pgTable(...)',
      referencedTables: ['users']
    }
  ]

  describe('generateClient', () => {
    it('should generate client code for PostgreSQL', () => {
      const clientCode = generateClient({
        schemas: mockSchemas,
        databaseType: 'postgres'
      })

      expect(clientCode).toContain('AUTO-GENERATED')
      expect(clientCode).toContain('mist-orm')
      expect(clientCode).toContain('createConnection')
      expect(clientCode).toContain('insert')
      expect(clientCode).toContain('findOne')
      expect(clientCode).toContain('findMany')
      expect(clientCode).toContain('update')
      expect(clientCode).toContain('deleteRecords')
    })

    it('should generate client code for SQLite', () => {
      const clientCode = generateClient({
        schemas: mockSchemas,
        databaseType: 'sqlite'
      })

      expect(clientCode).toContain('AUTO-GENERATED')
      expect(clientCode).toContain('type: \'sqlite\'')
    })

    it('should include table clients for each schema', () => {
      const clientCode = generateClient({
        schemas: mockSchemas,
        databaseType: 'postgres'
      })

      expect(clientCode).toContain('export const users = {')
      expect(clientCode).toContain('export const posts = {')
    })

    it('should include main db export', () => {
      const clientCode = generateClient({
        schemas: mockSchemas,
        databaseType: 'postgres'
      })

      expect(clientCode).toContain('export const db = {')
      expect(clientCode).toContain('users,')
      expect(clientCode).toContain('posts,')
    })

    it('should include type imports', () => {
      const clientCode = generateClient({
        schemas: mockSchemas,
        databaseType: 'postgres'
      })

      expect(clientCode).toContain('User')
      expect(clientCode).toContain('NewUser')
      expect(clientCode).toContain('Post')
      expect(clientCode).toContain('NewPost')
    })
  })
})
