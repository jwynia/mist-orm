/**
 * PostgreSQL Integration Test: Conventions
 *
 * Tests that conventions work correctly:
 * - Foreign keys (userId → users.id)
 * - Timestamps (createdAt, updatedAt)
 * - Primary keys (id field)
 * - Pluralization (User → users)
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import {
  createTestProject,
  cleanupTestProject,
  writeConfig,
  runMistCLI,
  cleanPostgresDatabase,
  POSTGRES_CONFIG,
} from '../setup/helpers'
import { readFile } from 'fs/promises'
import { join } from 'path'

describe('PostgreSQL Conventions', () => {
  afterAll(async () => {
    // Clean database after all tests
    await cleanPostgresDatabase()
  })

  it('should pluralize table names (User → users)', async () => {
    const project = await createTestProject('postgres-pluralization', {
      'user.ts': `
export interface User {
  id: string
  name: string
}
`,
    })

    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    await runMistCLI(['generate', '--config', project.configPath])

    // Check schema file name
    const schemaPath = join(project.outputDir, 'schema', 'users.ts')
    const schemaContent = await readFile(schemaPath, 'utf-8')

    // Should use plural table name
    expect(schemaContent).toContain('users')

    await cleanupTestProject(project.projectDir)
  })

  it('should generate foreign keys from naming convention', async () => {
    const project = await createTestProject('postgres-foreign-keys', {
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
  userId: string  // Should become foreign key to users.id
}
`,
    })

    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    await runMistCLI(['generate', '--config', project.configPath])

    // Check posts schema for foreign key
    const postsSchema = await readFile(join(project.outputDir, 'schema', 'posts.ts'), 'utf-8')

    // Should reference users table
    expect(postsSchema).toContain('users')

    await cleanupTestProject(project.projectDir)
  })

  it('should add timestamp fields automatically', async () => {
    const project = await createTestProject('postgres-timestamps', {
      'user.ts': `
export interface User {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}
`,
    })

    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    await runMistCLI(['generate', '--config', project.configPath])

    const schemaContent = await readFile(
      join(project.outputDir, 'schema', 'users.ts'),
      'utf-8'
    )

    // Should have timestamp columns
    expect(schemaContent).toContain('created_at')
    expect(schemaContent).toContain('updated_at')
    expect(schemaContent).toContain('timestamp')

    await cleanupTestProject(project.projectDir)
  })

  it('should generate UUID primary keys by default', async () => {
    const project = await createTestProject('postgres-primary-key', {
      'user.ts': `
export interface User {
  id: string
  name: string
}
`,
    })

    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    await runMistCLI(['generate', '--config', project.configPath])

    const schemaContent = await readFile(
      join(project.outputDir, 'schema', 'users.ts'),
      'utf-8'
    )

    // Should have UUID primary key
    expect(schemaContent).toContain('uuid')
    expect(schemaContent).toContain('primaryKey')

    await cleanupTestProject(project.projectDir)
  })

  it('should handle complex relationships', async () => {
    const project = await createTestProject('postgres-relationships', {
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
      'comment.ts': `
export interface Comment {
  id: string
  content: string
  postId: string
  userId: string  // Multiple foreign keys
}
`,
    })

    await writeConfig(
      project.configPath,
      project.modelsDir,
      project.outputDir,
      POSTGRES_CONFIG.connectionString
    )

    await runMistCLI(['generate', '--config', project.configPath])

    // Check comments schema for multiple foreign keys
    const commentsSchema = await readFile(
      join(project.outputDir, 'schema', 'comments.ts'),
      'utf-8'
    )

    // Should reference both users and posts
    expect(commentsSchema).toContain('users')
    expect(commentsSchema).toContain('posts')

    await cleanupTestProject(project.projectDir)
  })
})
