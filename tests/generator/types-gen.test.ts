/**
 * Tests for TypeScript type file generation
 */

import { describe, it, expect } from 'vitest'
import { generateTypeFile, generateTypesIndex } from '../../src/generator/types-gen'
import type { GeneratedSchema } from '../../src/generator/postgres'

describe('Types Generator', () => {
  const mockSchema: GeneratedSchema = {
    tableName: 'users',
    code: 'export const users = pgTable(...)',
    referencedTables: []
  }

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

  describe('generateTypeFile', () => {
    it('should generate type file with AUTO-GENERATED header', () => {
      const typeCode = generateTypeFile(mockSchema)

      expect(typeCode).toContain('AUTO-GENERATED')
      expect(typeCode).toContain('DO NOT EDIT')
      expect(typeCode).toContain('mist-orm')
    })

    it('should import InferSelectModel and InferInsertModel', () => {
      const typeCode = generateTypeFile(mockSchema)

      expect(typeCode).toContain('import type { InferSelectModel, InferInsertModel }')
      expect(typeCode).toContain('drizzle-orm')
    })

    it('should import the schema', () => {
      const typeCode = generateTypeFile(mockSchema)

      expect(typeCode).toContain('import { users } from')
      expect(typeCode).toContain('../schema/users.js')
    })

    it('should export select type (PascalCase)', () => {
      const typeCode = generateTypeFile(mockSchema)

      expect(typeCode).toContain('export type Users = InferSelectModel<typeof users>')
    })

    it('should export insert type (New prefix)', () => {
      const typeCode = generateTypeFile(mockSchema)

      expect(typeCode).toContain('export type NewUsers = InferInsertModel<typeof users>')
    })

    it('should handle snake_case table names', () => {
      const snakeCaseSchema: GeneratedSchema = {
        tableName: 'user_profiles',
        code: 'export const user_profiles = pgTable(...)',
        referencedTables: []
      }

      const typeCode = generateTypeFile(snakeCaseSchema)

      expect(typeCode).toContain('UserProfiles')
      expect(typeCode).toContain('NewUserProfiles')
    })
  })

  describe('generateTypesIndex', () => {
    it('should generate index file with AUTO-GENERATED header', () => {
      const indexCode = generateTypesIndex(mockSchemas)

      expect(indexCode).toContain('AUTO-GENERATED')
      expect(indexCode).toContain('DO NOT EDIT')
    })

    it('should export all types', () => {
      const indexCode = generateTypesIndex(mockSchemas)

      expect(indexCode).toContain('export type { Users, NewUsers } from \'./users.js\'')
      expect(indexCode).toContain('export type { Posts, NewPosts } from \'./posts.js\'')
    })
  })
})
