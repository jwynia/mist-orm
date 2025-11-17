import { describe, it, expect, vi } from 'vitest'
import { join } from 'path'
import { writeSchemas, type FileSystem } from '../../src/generator/writer'
import type { GeneratedSchema } from '../../src/generator/postgres'

describe('File Writer', () => {
  it('should create output directory if not exists', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const users = pgTable('users', { ... })",
        tableName: 'users',
        imports: ['pgTable', 'text'],
        referencedTables: [],
      },
    ]

    await writeSchemas(schemas, './.mist', 'postgres', mockFs)

    expect(mockFs.mkdir).toHaveBeenCalledWith(join('./.mist', 'schema'), { recursive: true })
  })

  it('should write individual schema files', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const users = pgTable('users', { id: uuid('id') })",
        tableName: 'users',
        imports: ['pgTable', 'uuid'],
        referencedTables: [],
      },
      {
        code: "export const posts = pgTable('posts', { id: uuid('id') })",
        tableName: 'posts',
        imports: ['pgTable', 'uuid'],
        referencedTables: ['users'],
      },
    ]

    await writeSchemas(schemas, './.mist', 'postgres', mockFs)

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      join('./.mist', 'schema', 'users.ts'),
      "export const users = pgTable('users', { id: uuid('id') })",
      'utf-8'
    )
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      join('./.mist', 'schema', 'posts.ts'),
      "export const posts = pgTable('posts', { id: uuid('id') })",
      'utf-8'
    )
  })

  it('should write schema index file', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const users = ...",
        tableName: 'users',
        imports: [],
        referencedTables: [],
      },
      {
        code: "export const posts = ...",
        tableName: 'posts',
        imports: [],
        referencedTables: [],
      },
    ]

    await writeSchemas(schemas, './.mist', 'postgres', mockFs)

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      join('./.mist', 'schema', 'index.ts'),
      expect.stringContaining("export * from './users'"),
      'utf-8'
    )
    expect(mockFs.writeFile).toHaveBeenCalledWith(
      join('./.mist', 'schema', 'index.ts'),
      expect.stringContaining("export * from './posts'"),
      'utf-8'
    )
  })

  it('should order exports in index file correctly', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const posts = ...",
        tableName: 'posts',
        imports: [],
        referencedTables: ['users'], // posts depends on users
      },
      {
        code: "export const users = ...",
        tableName: 'users',
        imports: [],
        referencedTables: [], // no dependencies
      },
    ]

    await writeSchemas(schemas, './.mist', 'postgres', mockFs)

    const indexCall = (mockFs.writeFile as any).mock.calls.find(
      (call: any[]) => call[0] === join('./.mist', 'schema', 'index.ts')
    )
    const indexContent = indexCall[1]

    // users should be exported before posts (dependency order)
    const usersIndex = indexContent.indexOf("export * from './users'")
    const postsIndex = indexContent.indexOf("export * from './posts'")

    expect(usersIndex).toBeLessThan(postsIndex)
  })

  it('should handle file system errors gracefully', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockRejectedValue(new Error('Permission denied')),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const users = ...",
        tableName: 'users',
        imports: [],
        referencedTables: [],
      },
    ]

    await expect(writeSchemas(schemas, './.mist', 'postgres', mockFs)).rejects.toThrow('Permission denied')
  })

  it('should create directory structure', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(false),
    }

    const schemas: GeneratedSchema[] = [
      {
        code: "export const users = ...",
        tableName: 'users',
        imports: [],
        referencedTables: [],
      },
    ]

    await writeSchemas(schemas, './.mist', 'postgres', mockFs)

    expect(mockFs.mkdir).toHaveBeenCalledWith(join('./.mist', 'schema'), { recursive: true })
  })
})
