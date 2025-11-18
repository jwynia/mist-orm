/**
 * SQLite Integration Test: CRUD Operations
 *
 * Tests the full workflow with SQLite:
 * 1. Define TypeScript interfaces
 * 2. Generate Drizzle schemas for SQLite
 * 3. Verify generated code
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestProject, cleanupTestProject, writeConfig, runMistCLI } from '../setup/helpers'
import { readFile } from 'fs/promises'
import { join } from 'path'

describe('SQLite CRUD Operations', () => {
  let projectDir: string
  let outputDir: string

  beforeAll(async () => {
    // Create test project with a simple User model
    const project = await createTestProject('sqlite-crud', {
      'user.ts': `
export interface User {
  id: string
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}
`,
    })

    projectDir = project.projectDir
    outputDir = project.outputDir

    // SQLite connection string
    const sqliteDb = join(projectDir, 'test.db')

    // Write config with SQLite connection
    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      `sqlite://${sqliteDb}`
    )

    // Generate schemas
    await runMistCLI(['generate', '--config', project.configPath])
  })

  afterAll(async () => {
    // Clean up test project
    await cleanupTestProject(projectDir)
  })

  it('should generate valid SQLite schema files', async () => {
    // Check that schema file exists
    const schemaPath = join(outputDir, 'schema', 'users.ts')
    const schemaContent = await readFile(schemaPath, 'utf-8')

    // Should use SQLite-specific table type
    expect(schemaContent).toContain('sqliteTable')
    expect(schemaContent).toContain('users')
    expect(schemaContent).toContain('text')
  })

  it('should generate a working database client for SQLite', async () => {
    // Check that client file exists and contains expected exports
    const clientPath = join(outputDir, 'client.ts')
    const clientContent = await readFile(clientPath, 'utf-8')

    expect(clientContent).toContain('export const db')
    expect(clientContent).toContain('users')
    // Client uses runtime abstraction, not direct database driver
    expect(clientContent).toContain('sqlite')
  })

  it('should generate appropriate SQLite types', async () => {
    const schemaPath = join(outputDir, 'schema', 'users.ts')
    const schemaContent = await readFile(schemaPath, 'utf-8')

    // SQLite uses text for UUIDs
    expect(schemaContent).toContain('text')

    // Should have timestamp fields
    expect(schemaContent).toMatch(/created_at|createdAt/)
  })

  it.skip('should perform INSERT operation with SQLite', async () => {
    // TODO: Implement when we have a stable way to run generated code in tests
  })
})
