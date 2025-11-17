/**
 * Tests for database connection management
 */

import { describe, it, expect, vi } from 'vitest'

describe('Connection Management', () => {
  describe('detectDatabaseType (from config/loader)', () => {
    it('should detect PostgreSQL from postgresql:// URL', async () => {
      const { detectDatabaseType } = await import('../../src/config/loader')
      expect(detectDatabaseType('postgresql://localhost/mydb')).toBe('postgres')
    })

    it('should detect PostgreSQL from postgres:// URL', async () => {
      const { detectDatabaseType } = await import('../../src/config/loader')
      expect(detectDatabaseType('postgres://localhost/mydb')).toBe('postgres')
    })

    it('should detect SQLite from file path', async () => {
      const { detectDatabaseType } = await import('../../src/config/loader')
      expect(detectDatabaseType('./mydb.sqlite')).toBe('sqlite')
      expect(detectDatabaseType('/var/data/mydb.db')).toBe('sqlite')
    })

    it('should detect SQLite from sqlite:// URL', async () => {
      const { detectDatabaseType } = await import('../../src/config/loader')
      expect(detectDatabaseType('sqlite://./mydb.sqlite')).toBe('sqlite')
    })
  })

  describe('Connection creation', () => {
    it('should export createConnection function', async () => {
      const { createConnection } = await import('../../src/runtime/connection')
      expect(typeof createConnection).toBe('function')
    })

    it('should export closeConnection function', async () => {
      const { closeConnection } = await import('../../src/runtime/connection')
      expect(typeof closeConnection).toBe('function')
    })
  })
})
