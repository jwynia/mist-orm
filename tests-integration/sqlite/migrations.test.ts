/**
 * SQLite Integration Test: Migrations
 *
 * Tests the migration system with SQLite
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestProject, cleanupTestProject, writeConfig, runMistCLI } from '../setup/helpers'
import { writeFile, readdir } from 'fs/promises'
import { join } from 'path'

describe('SQLite Migrations', () => {
  let projectDir: string
  let modelsDir: string
  let outputDir: string
  let configPath: string
  let dbPath: string

  beforeEach(async () => {
    // Create a fresh test project for each test
    const project = await createTestProject('sqlite-migrations', {
      'user.ts': `
export interface User {
  id: string
  name: string
  email: string
}
`,
    })

    projectDir = project.projectDir
    modelsDir = project.modelsDir
    outputDir = project.outputDir
    configPath = project.configPath
    dbPath = join(projectDir, 'test.db')

    // Write config with SQLite connection
    await writeConfig(configPath, modelsDir, outputDir, `sqlite://${dbPath}`)
  })

  afterEach(async () => {
    // Clean up test project
    await cleanupTestProject(projectDir)
  })

  it('should generate migration files for SQLite', async () => {
    // Generate migrations (not just schemas)
    await runMistCLI(['migrate', 'generate', '--config', configPath])

    // Check that migration directory exists
    const migrationsPath = join(outputDir, 'migrations')
    const migrationFiles = await readdir(migrationsPath)

    // Should have at least one migration file
    expect(migrationFiles.length).toBeGreaterThan(0)

    // Migration files should be SQL
    const sqlFiles = migrationFiles.filter((f) => f.endsWith('.sql'))
    expect(sqlFiles.length).toBeGreaterThan(0)
  })

  it('should detect schema changes in SQLite', async () => {
    // Generate initial schema
    await runMistCLI(['generate', '--config', configPath])

    // Modify the model (add a field)
    await writeFile(
      join(modelsDir, 'user.ts'),
      `
export interface User {
  id: string
  name: string
  email: string
  age: number  // NEW FIELD
}
`
    )

    // Generate again (should detect changes)
    const { stdout } = await runMistCLI(['generate', '--config', configPath])

    // Should indicate some kind of generation/update
    expect(stdout).toBeTruthy()
  })

  it.skip('should apply migrations to SQLite database', async () => {
    // TODO: Test migration application with actual SQLite database
  })
})
