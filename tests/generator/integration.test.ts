import { describe, it, expect, vi } from 'vitest'
import { generate } from '../../src/generator'
import type { ResolvedMistConfig } from '../../src/config/types'
import type { FileSystem } from '../../src/generator/writer'
import { join } from 'path'

describe('End-to-End Integration', () => {
  const mockConfig: ResolvedMistConfig = {
    models: join(__dirname, '../fixtures/*.ts'),
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

  it('should run complete generation pipeline', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    const progressMessages: string[] = []
    const onProgress = (msg: string) => progressMessages.push(msg)

    const result = await generate({
      config: mockConfig,
      fs: mockFs,
      onProgress,
    })

    // Should find and parse interfaces
    expect(result.interfacesFound).toBeGreaterThan(0)
    expect(result.schemasGenerated).toBe(result.interfacesFound)
    expect(result.tableNames.length).toBeGreaterThan(0)
    expect(result.outputDir).toBe('./.mist')

    // Should create output directory
    expect(mockFs.mkdir).toHaveBeenCalled()

    // Should write schema files
    expect(mockFs.writeFile).toHaveBeenCalled()

    // Should write at least one schema file + index file
    const writeFileCalls = (mockFs.writeFile as any).mock.calls
    expect(writeFileCalls.length).toBeGreaterThan(1)

    // Should generate progress messages
    expect(progressMessages.length).toBeGreaterThan(0)
    expect(progressMessages.some(msg => msg.includes('Discovering'))).toBe(true)
    expect(progressMessages.some(msg => msg.includes('Parsing'))).toBe(true)
    expect(progressMessages.some(msg => msg.includes('Generating'))).toBe(true)
  })

  it('should generate PostgreSQL schemas', async () => {
    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    await generate({
      config: mockConfig,
      fs: mockFs,
    })

    // Check that generated code contains PostgreSQL-specific imports
    const writeFileCalls = (mockFs.writeFile as any).mock.calls
    const schemaFile = writeFileCalls.find((call: any) =>
      call[0].endsWith('.ts') && !call[0].endsWith('index.ts')
    )

    if (schemaFile) {
      const content = schemaFile[1]
      expect(content).toContain('drizzle-orm/pg-core')
    }
  })

  it('should generate SQLite schemas when configured', async () => {
    const sqliteConfig: ResolvedMistConfig = {
      ...mockConfig,
      connection: 'sqlite://./test.db',
      database: {
        type: 'sqlite',
        schema: 'public',
      },
    }

    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    await generate({
      config: sqliteConfig,
      fs: mockFs,
    })

    // Check that generated code contains SQLite-specific imports
    const writeFileCalls = (mockFs.writeFile as any).mock.calls
    const schemaFile = writeFileCalls.find((call: any) =>
      call[0].endsWith('.ts') && !call[0].endsWith('index.ts')
    )

    if (schemaFile) {
      const content = schemaFile[1]
      expect(content).toContain('drizzle-orm/sqlite-core')
    }
  })

  it('should throw error if no model files found', async () => {
    const badConfig: ResolvedMistConfig = {
      ...mockConfig,
      models: '/nonexistent/**/*.ts',
    }

    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    await expect(generate({
      config: badConfig,
      fs: mockFs,
    })).rejects.toThrow(/no model files found/i)
  })

  it('should handle multiple model patterns', async () => {
    const multiPatternConfig: ResolvedMistConfig = {
      ...mockConfig,
      models: [
        join(__dirname, '../fixtures/simple-interface.ts'),
        join(__dirname, '../fixtures/optional-fields.ts'),
      ],
    }

    const mockFs: FileSystem = {
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
    }

    const result = await generate({
      config: multiPatternConfig,
      fs: mockFs,
    })

    expect(result.interfacesFound).toBeGreaterThan(0)
    expect(result.schemasGenerated).toBe(result.interfacesFound)
  })
})
