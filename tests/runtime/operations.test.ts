/**
 * Tests for CRUD operations
 */

import { describe, it, expect } from 'vitest'

describe('CRUD Operations', () => {
  it('should export insert function', async () => {
    const { insert } = await import('../../src/runtime/operations')
    expect(typeof insert).toBe('function')
  })

  it('should export findOne function', async () => {
    const { findOne } = await import('../../src/runtime/operations')
    expect(typeof findOne).toBe('function')
  })

  it('should export findMany function', async () => {
    const { findMany } = await import('../../src/runtime/operations')
    expect(typeof findMany).toBe('function')
  })

  it('should export update function', async () => {
    const { update } = await import('../../src/runtime/operations')
    expect(typeof update).toBe('function')
  })

  it('should export deleteRecords function', async () => {
    const { deleteRecords } = await import('../../src/runtime/operations')
    expect(typeof deleteRecords).toBe('function')
  })
})
