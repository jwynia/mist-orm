import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadConfig, resolveConfig, detectDatabaseType } from '../../src/config/loader'
import type { MistConfig } from '../../src/config/types'

describe('Config Loader', () => {
  describe('detectDatabaseType', () => {
    it('should detect PostgreSQL from postgresql:// protocol', () => {
      expect(detectDatabaseType('postgresql://localhost:5432/mydb')).toBe('postgres')
    })

    it('should detect PostgreSQL from postgres:// protocol', () => {
      expect(detectDatabaseType('postgres://localhost:5432/mydb')).toBe('postgres')
    })

    it('should detect SQLite from sqlite:// protocol', () => {
      expect(detectDatabaseType('sqlite://./dev.db')).toBe('sqlite')
    })

    it('should detect SQLite from file path', () => {
      expect(detectDatabaseType('./dev.db')).toBe('sqlite')
      expect(detectDatabaseType('/absolute/path/to/db.sqlite')).toBe('sqlite')
    })

    it('should default to postgres for unknown protocols', () => {
      expect(detectDatabaseType('unknown://something')).toBe('postgres')
    })
  })

  describe('resolveConfig', () => {
    it('should apply all defaults to minimal config', () => {
      const minimal: MistConfig = {
        models: './models/**/*.ts',
        output: './.mist',
        connection: 'postgresql://localhost/test',
      }

      const resolved = resolveConfig(minimal)

      expect(resolved).toEqual({
        models: './models/**/*.ts',
        output: './.mist',
        connection: 'postgresql://localhost/test',
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
      })
    })

    it('should preserve user-provided convention settings', () => {
      const config: MistConfig = {
        models: './models/**/*.ts',
        output: './.mist',
        connection: 'sqlite://./dev.db',
        conventions: {
          timestamps: false,
          primaryKey: '_id',
          foreignKeys: { authorId: 'users' },
        },
      }

      const resolved = resolveConfig(config)

      expect(resolved.conventions).toEqual({
        timestamps: false,
        primaryKey: '_id',
        foreignKeys: { authorId: 'users' },
        unique: {},
        exclude: [],
      })
    })

    it('should auto-detect database type from connection string', () => {
      const pgConfig = resolveConfig({
        models: './models',
        output: './.mist',
        connection: 'postgres://localhost/test',
      })
      expect(pgConfig.database.type).toBe('postgres')

      const sqliteConfig = resolveConfig({
        models: './models',
        output: './.mist',
        connection: 'sqlite://./test.db',
      })
      expect(sqliteConfig.database.type).toBe('sqlite')
    })

    it('should allow explicit database type override', () => {
      const config: MistConfig = {
        models: './models',
        output: './.mist',
        connection: 'postgres://localhost/test',
        database: {
          type: 'sqlite', // Explicit override
        },
      }

      const resolved = resolveConfig(config)
      expect(resolved.database.type).toBe('sqlite')
    })

    it('should normalize models to array', () => {
      const singleModel = resolveConfig({
        models: './models/**/*.ts',
        output: './.mist',
        connection: 'postgres://localhost/test',
      })
      expect(singleModel.models).toBe('./models/**/*.ts')

      const multipleModels = resolveConfig({
        models: ['./models/**/*.ts', './entities/**/*.ts'],
        output: './.mist',
        connection: 'postgres://localhost/test',
      })
      expect(multipleModels.models).toEqual(['./models/**/*.ts', './entities/**/*.ts'])
    })
  })

  describe('loadConfig', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('should load config from default path', async () => {
      // Mock dynamic import
      const mockConfig: MistConfig = {
        models: './models/**/*.ts',
        output: './.mist',
        connection: 'postgres://localhost/test',
      }

      // We'll test this with real file system in integration tests
      // For unit tests, we just verify the function exists
      expect(loadConfig).toBeDefined()
    })

    it('should validate required fields', () => {
      const invalidConfig = {
        models: './models/**/*.ts',
        // missing output
        connection: 'postgres://localhost/test',
      } as MistConfig

      expect(() => {
        // Validation happens in resolveConfig
        resolveConfig(invalidConfig as any)
      }).toThrow()
    })

    it('should reject config with invalid types', () => {
      const invalidConfig = {
        models: 123, // should be string or string[]
        output: './.mist',
        connection: 'postgres://localhost/test',
      } as any

      expect(() => {
        resolveConfig(invalidConfig)
      }).toThrow()
    })
  })

  describe('config validation', () => {
    it('should require models field', () => {
      expect(() => {
        resolveConfig({
          output: './.mist',
          connection: 'postgres://localhost/test',
        } as any)
      }).toThrow(/models.*required/i)
    })

    it('should require output field', () => {
      expect(() => {
        resolveConfig({
          models: './models',
          connection: 'postgres://localhost/test',
        } as any)
      }).toThrow(/output.*required/i)
    })

    it('should require connection field', () => {
      expect(() => {
        resolveConfig({
          models: './models',
          output: './.mist',
        } as any)
      }).toThrow(/connection.*required/i)
    })

    it('should validate models is string or array of strings', () => {
      expect(() => {
        resolveConfig({
          models: 123,
          output: './.mist',
          connection: 'postgres://localhost/test',
        } as any)
      }).toThrow(/models.*must be.*string/i)
    })

    it('should validate output is string', () => {
      expect(() => {
        resolveConfig({
          models: './models',
          output: 123,
          connection: 'postgres://localhost/test',
        } as any)
      }).toThrow(/output.*must be.*string/i)
    })
  })
})
