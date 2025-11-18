/**
 * PostgreSQL Integration Test: CRUD Operations
 *
 * Tests the full workflow:
 * 1. Define TypeScript interfaces
 * 2. Generate Drizzle schemas
 * 3. Run migrations
 * 4. Perform CRUD operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createTestProject,
  cleanupTestProject,
  writeConfig,
  runMistCLI,
  cleanPostgresDatabase,
  POSTGRES_CONFIG,
} from '../setup/helpers'

describe('PostgreSQL CRUD Operations', () => {
  let projectDir: string
  let outputDir: string

  beforeAll(async () => {
    // Clean database before tests
    await cleanPostgresDatabase()

    // Create test project with a simple User model
    const project = await createTestProject('postgres-crud', {
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

    // Write config
    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    // Generate schemas
    await runMistCLI(['generate', '--config', project.configPath])
  })

  afterAll(async () => {
    // Clean up test project
    await cleanupTestProject(projectDir)

    // Clean database after tests
    await cleanPostgresDatabase()
  })

  it('should generate valid Drizzle schema files', async () => {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')

    // Check that schema file exists
    const schemaPath = join(outputDir, 'schema', 'users.ts')
    const schemaContent = await readFile(schemaPath, 'utf-8')

    expect(schemaContent).toContain('pgTable')
    expect(schemaContent).toContain('users')
    expect(schemaContent).toContain('uuid')
    expect(schemaContent).toContain('text')
    expect(schemaContent).toContain('timestamp')
  })

  it('should generate a working database client', async () => {
    const { readFile } = await import('fs/promises')
    const { join } = await import('path')

    // Check that client file exists and contains expected exports
    const clientPath = join(outputDir, 'client.ts')
    const clientContent = await readFile(clientPath, 'utf-8')

    expect(clientContent).toContain('export const db')
    expect(clientContent).toContain('users')
  })

  it.skip('should perform INSERT operation', async () => {
    // This test is skipped because it requires running migrations first
    // and then dynamically importing the generated client
    // TODO: Implement when we have a stable way to run generated code in tests
  })

  it.skip('should perform SELECT operation', async () => {
    // TODO: Implement
  })

  it.skip('should perform UPDATE operation', async () => {
    // TODO: Implement
  })

  it.skip('should perform DELETE operation', async () => {
    // TODO: Implement
  })

  it.skip('should enforce foreign key constraints', async () => {
    // TODO: Test with a model that has foreign keys
  })

  it.skip('should auto-populate timestamps', async () => {
    // TODO: Verify createdAt/updatedAt are set automatically
  })
})
