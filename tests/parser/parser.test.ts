import { describe, it, expect } from 'vitest'
import { parseFile, parseSource } from '../../src/parser/parser'
import { join } from 'path'

const FIXTURES_DIR = join(__dirname, '../fixtures')

describe('TypeScript Parser', () => {
  describe('parseSource', () => {
    it('should parse a simple interface with basic types', () => {
      const source = `
        export interface User {
          id: string
          name: string
          age: number
          active: boolean
        }
      `

      const result = parseSource(source, 'test.ts')

      expect(result.interfaces).toHaveLength(1)
      expect(result.interfaces[0].name).toBe('User')
      expect(result.interfaces[0].properties).toHaveLength(4)

      const props = result.interfaces[0].properties
      expect(props[0]).toEqual({
        name: 'id',
        type: 'string',
        optional: false,
        jsDocTags: {},
      })
      expect(props[1]).toEqual({
        name: 'name',
        type: 'string',
        optional: false,
        jsDocTags: {},
      })
      expect(props[2]).toEqual({
        name: 'age',
        type: 'number',
        optional: false,
        jsDocTags: {},
      })
      expect(props[3]).toEqual({
        name: 'active',
        type: 'boolean',
        optional: false,
        jsDocTags: {},
      })
    })

    it('should detect optional fields', () => {
      const source = `
        export interface Post {
          id: string
          title: string
          published?: boolean
        }
      `

      const result = parseSource(source, 'test.ts')
      const props = result.interfaces[0].properties

      expect(props[0].optional).toBe(false)
      expect(props[1].optional).toBe(false)
      expect(props[2].optional).toBe(true)
    })

    it('should handle Date type', () => {
      const source = `
        export interface Event {
          id: string
          occurredAt: Date
        }
      `

      const result = parseSource(source, 'test.ts')
      const props = result.interfaces[0].properties

      expect(props[1]).toEqual({
        name: 'occurredAt',
        type: 'Date',
        optional: false,
        jsDocTags: {},
      })
    })

    it('should handle array types', () => {
      const source = `
        export interface Product {
          id: string
          tags: string[]
        }
      `

      const result = parseSource(source, 'test.ts')
      const props = result.interfaces[0].properties

      expect(props[1]).toEqual({
        name: 'tags',
        type: 'string[]',
        optional: false,
        jsDocTags: {},
      })
    })

    it('should handle Record types', () => {
      const source = `
        export interface Product {
          id: string
          metadata: Record<string, any>
        }
      `

      const result = parseSource(source, 'test.ts')
      const props = result.interfaces[0].properties

      expect(props[1].name).toBe('metadata')
      expect(props[1].type).toMatch(/Record<.*>/)
    })

    it('should extract JSDoc tags', () => {
      const source = `
        export interface Account {
          id: string
          /**
           * @unique
           */
          email: string
          /**
           * @index
           * @description User's full name
           */
          name: string
        }
      `

      const result = parseSource(source, 'test.ts')
      const props = result.interfaces[0].properties

      expect(props[0].jsDocTags).toEqual({})
      expect(props[1].jsDocTags).toEqual({ unique: '' })
      expect(props[2].jsDocTags).toHaveProperty('index')
      expect(props[2].jsDocTags).toHaveProperty('description')
      expect(props[2].jsDocTags.description).toBe("User's full name")
    })

    it('should capture location information', () => {
      const source = `
        export interface User {
          id: string
        }
      `

      const result = parseSource(source, 'test-file.ts')

      expect(result.interfaces[0].location.file).toBe('test-file.ts')
      expect(result.interfaces[0].location.line).toBeGreaterThan(0)
    })

    it('should parse multiple interfaces in one file', () => {
      const source = `
        export interface User {
          id: string
        }

        export interface Post {
          id: string
          userId: string
        }
      `

      const result = parseSource(source, 'test.ts')

      expect(result.interfaces).toHaveLength(2)
      expect(result.interfaces[0].name).toBe('User')
      expect(result.interfaces[1].name).toBe('Post')
    })

    it('should handle interfaces that extend others', () => {
      const source = `
        export interface Base {
          id: string
        }

        export interface User extends Base {
          name: string
        }
      `

      const result = parseSource(source, 'test.ts')

      expect(result.interfaces[1].extends).toEqual(['Base'])
    })

    it('should ignore non-exported interfaces', () => {
      const source = `
        interface Internal {
          id: string
        }

        export interface Public {
          id: string
        }
      `

      const result = parseSource(source, 'test.ts')

      expect(result.interfaces).toHaveLength(1)
      expect(result.interfaces[0].name).toBe('Public')
    })

    it('should handle empty interfaces', () => {
      const source = `
        export interface Empty {
        }
      `

      const result = parseSource(source, 'test.ts')

      expect(result.interfaces).toHaveLength(1)
      expect(result.interfaces[0].properties).toHaveLength(0)
    })

    it('should handle syntax errors gracefully', () => {
      const source = `
        export interface Broken {
          id: string
          name: // missing type
        }
      `

      expect(() => {
        parseSource(source, 'test.ts')
      }).toThrow(/parse error|syntax/i)
    })
  })

  describe('parseFile', () => {
    it('should parse a file from disk', async () => {
      const filePath = join(FIXTURES_DIR, 'simple-interface.ts')
      const result = await parseFile(filePath)

      expect(result.interfaces).toHaveLength(1)
      expect(result.interfaces[0].name).toBe('User')
      expect(result.filePath).toBe(filePath)
    })

    it('should handle file not found', async () => {
      await expect(parseFile('/nonexistent/file.ts')).rejects.toThrow()
    })
  })
})
