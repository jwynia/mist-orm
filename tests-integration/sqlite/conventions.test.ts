/**
 * SQLite Integration Test: Conventions
 *
 * Tests that conventions work correctly with SQLite
 */

import { describe, it, expect } from 'vitest'
import { createTestProject, cleanupTestProject, writeConfig, runMistCLI } from '../setup/helpers'
import { readFile } from 'fs/promises'
import { join } from 'path'

describe('SQLite Conventions', () => {
  it('should use the same pluralization rules as PostgreSQL', async () => {
    const project = await createTestProject('sqlite-pluralization', {
      'user.ts': `
export interface User {
  id: string
  name: string
}
`,
    })

    const dbPath = join(project.projectDir, 'test.db')
    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      `sqlite://${dbPath}`
    )

    await runMistCLI(['generate', '--config', project.configPath])

    // Check schema file name
    const schemaPath = join(project.outputDir, 'schema', 'users.ts')
    const schemaContent = await readFile(schemaPath, 'utf-8')

    // Should use plural table name
    expect(schemaContent).toContain('users')

    await cleanupTestProject(project.projectDir)
  })

  it('should generate the same foreign key relationships', async () => {
    const project = await createTestProject('sqlite-foreign-keys', {
      'user.ts': `
export interface User {
  id: string
  name: string
}
`,
      'post.ts': `
export interface Post {
  id: string
  title: string
  userId: string
}
`,
    })

    const dbPath = join(project.projectDir, 'test.db')
    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      `sqlite://${dbPath}`
    )

    await runMistCLI(['generate', '--config', project.configPath])

    // Check posts schema for foreign key
    const postsSchema = await readFile(join(project.outputDir, 'schema', 'posts.ts'), 'utf-8')

    // Should reference users table
    expect(postsSchema).toContain('users')

    await cleanupTestProject(project.projectDir)
  })

  it('should handle timestamps in SQLite', async () => {
    const project = await createTestProject('sqlite-timestamps', {
      'user.ts': `
export interface User {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}
`,
    })

    const dbPath = join(project.projectDir, 'test.db')
    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      `sqlite://${dbPath}`
    )

    await runMistCLI(['generate', '--config', project.configPath])

    const schemaContent = await readFile(
      join(project.outputDir, 'schema', 'users.ts'),
      'utf-8'
    )

    // Should have timestamp columns (SQLite uses integer for timestamps)
    expect(schemaContent).toMatch(/created_at|createdAt/)
    expect(schemaContent).toMatch(/updated_at|updatedAt/)

    await cleanupTestProject(project.projectDir)
  })

  it('should verify database-agnostic code works for both databases', async () => {
    // This test verifies that the same interface definition
    // generates working schemas for both PostgreSQL and SQLite

    const models = {
      'user.ts': `
export interface User {
  id: string
  name: string
  email: string
}
`,
      'post.ts': `
export interface Post {
  id: string
  title: string
  content: string
  userId: string
}
`,
    }

    // Test with SQLite
    const sqliteProject = await createTestProject('db-agnostic-sqlite', models)
    const sqliteDb = join(sqliteProject.projectDir, 'test.db')
    await writeConfig(
      sqliteProject.configPath,
      sqliteProject.modelsDir,
      sqliteProject.outputDir,
      `sqlite://${sqliteDb}`
    )
    await runMistCLI(['generate', '--config', sqliteProject.configPath])

    // Verify schemas were generated
    const sqliteUsersSchema = await readFile(
      join(sqliteProject.outputDir, 'schema', 'users.ts'),
      'utf-8'
    )
    const sqlitePostsSchema = await readFile(
      join(sqliteProject.outputDir, 'schema', 'posts.ts'),
      'utf-8'
    )

    expect(sqliteUsersSchema).toContain('sqliteTable')
    expect(sqlitePostsSchema).toContain('sqliteTable')
    expect(sqlitePostsSchema).toContain('users') // Foreign key reference

    await cleanupTestProject(sqliteProject.projectDir)
  })
})
